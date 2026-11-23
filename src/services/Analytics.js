import { APP_VERSION } from '../version.js';

/*
 * Opt-in, action-level usage analytics.
 *
 * Events are queued in chrome.storage.local and uploaded over a WebSocket to
 * the analytics server (see dynamic-snippets-web-back/src/analytics). Nothing is
 * recorded or sent unless the user has granted consent, and no snippet text,
 * variable values or other personal data is ever included: events carry only
 * the action name plus the small, fixed set of props allowed by EVENT_SCHEMAS.
 *
 * Build with VITE_ANALYTICS_WS_URL set (e.g. wss://api.example.com/analytics/ws)
 * to enable it. Without it, analytics is fully off and the consent prompt is hidden.
 */

const CONSENT_KEY = 'ds_analytics_consent';
const QUEUE_KEY = 'ds_analytics_queue';
const CLIENT_ID_KEY = 'ds_analytics_client_id';
const RETRY_KEY = 'ds_analytics_retry';
const LEGACY_EVENTS_KEY = 'ds_analytics_events';

const MAX_QUEUE = 500;
const BATCH_SIZE = 50;
const SOCKET_TIMEOUT_MS = 15_000;
const FLUSH_DEBOUNCE_MS = 5_000;
const MIN_FLUSH_GAP_MS = 30_000;
const PAUSED_RETRY_MS = 60 * 60 * 1000;
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;
const PROTOCOL_VERSION = 1;

export const ANALYTICS_SOCKET_URL = import.meta.env.VITE_ANALYTICS_WS_URL || '';
export const ANALYTICS_ENABLED = Boolean(ANALYTICS_SOCKET_URL);
const DEBUG = Boolean(import.meta.env.DEV);

/*
 * Must match EVENT_SCHEMAS in the server's src/analytics/eventSchema.ts. The
 * server rejects anything else, so checking here keeps bad events from ever
 * being queued and surfaces mistakes during development.
 */
const ONBOARDING_STEPS = ['welcome', 'organize', 'variables', 'globals', 'contextMenu', 'slash', 'personalize', 'ready'];
const VERSION_PATTERN = /^\d{1,4}\.\d{1,4}\.\d{1,4}(\.\d{1,5})?$/;

const EVENT_SCHEMAS = {
  popup_opened: {},
  consent_granted: {},
  onboarding_finished: {
    action: { type: 'enum', values: ['skip', 'explore', 'create'], required: true },
    step: { type: 'enum', values: ONBOARDING_STEPS, required: true }
  },
  onboarding_replayed: {},
  settings_opened: {},
  settings_saved: {},
  snippets_imported: {},
  snippets_exported: {},
  snippet_opened: {},
  snippet_created: {
    source: { type: 'enum', values: ['welcome', 'sidebar'] }
  },
  snippet_deleted: {},
  snippet_closed: {},
  folder_created: {},
  changelog_dismissed: {
    version: { type: 'version', required: true }
  },
  version_history_opened: {},
  context_menu_inserted: {
    source: { type: 'enum', values: ['context_menu'], required: true },
    hasVariables: { type: 'boolean', required: true },
    hasGlobals: { type: 'boolean', required: true }
  }
};

function debugLog(...args) {
  if (DEBUG) console.debug('[Analytics]', ...args);
}

// ---------------------------------------------------------------------------
// Storage. chrome.storage.local is shared by the popup and the service
// worker, so it's the single source of truth (localStorage only as a dev fallback).

const hasExtensionStorage = () => typeof chrome !== 'undefined' && Boolean(chrome?.storage?.local);

async function readKeys(keys) {
  if (hasExtensionStorage()) return chrome.storage.local.get(keys);
  const result = {};
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) result[key] = JSON.parse(raw);
    } catch {
      // Ignore unreadable values.
    }
  }
  return result;
}

async function writeKeys(items) {
  if (hasExtensionStorage()) return chrome.storage.local.set(items);
  for (const [key, value] of Object.entries(items)) localStorage.setItem(key, JSON.stringify(value));
}

async function removeKeys(keys) {
  if (hasExtensionStorage()) return chrome.storage.local.remove(keys);
  for (const key of keys) localStorage.removeItem(key);
}

/**
 * Serializes queue updates. navigator.locks is shared across the popup and the
 * service worker (same extension origin), so they can't overwrite each other's
 * writes; the promise chain covers contexts without it.
 */
let localChain = Promise.resolve();
function withQueueLock(fn) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('ds-analytics-queue', fn);
  }
  const run = localChain.then(fn, fn);
  localChain = run.catch(() => {});
  return run;
}

async function readQueue() {
  const result = await readKeys([QUEUE_KEY]);
  return Array.isArray(result[QUEUE_KEY]) ? result[QUEUE_KEY] : [];
}

async function hasConsent() {
  const result = await readKeys([CONSENT_KEY]).catch(() => ({}));
  if (result[CONSENT_KEY] === 'granted') return true;
  // The popup writes localStorage synchronously before chrome.storage settles,
  // so check it too to avoid dropping the event fired right after "Accept".
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

async function getClientId() {
  const result = await readKeys([CLIENT_ID_KEY]);
  const existing = result[CLIENT_ID_KEY];
  if (typeof existing === 'string' && existing.length === 36) return existing;
  const clientId = crypto.randomUUID();
  await writeKeys({ [CLIENT_ID_KEY]: clientId });
  return clientId;
}

// ---------------------------------------------------------------------------
// Validation

function validateProps(action, props) {
  const schema = EVENT_SCHEMAS[action];
  if (!schema) return { error: `unknown action "${action}"` };
  if (!props || typeof props !== 'object' || Array.isArray(props)) return { error: 'props must be an object' };

  const clean = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    const spec = schema[key];
    if (!spec) return { error: `unexpected prop "${key}"` };
    const ok =
      spec.type === 'boolean' ? typeof value === 'boolean' :
      spec.type === 'enum' ? spec.values.includes(value) :
      spec.type === 'version' ? typeof value === 'string' && VERSION_PATTERN.test(value) :
      false;
    if (!ok) return { error: `invalid value for "${key}"` };
    clean[key] = value;
  }
  for (const [key, spec] of Object.entries(schema)) {
    if (spec.required && !(key in clean)) return { error: `missing prop "${key}"` };
  }
  return { props: clean };
}

// ---------------------------------------------------------------------------
// Public API

/**
 * Records an analytics event. Fire-and-forget: never throws and never blocks
 * the UI. Returns a promise that settles once the event is queued (or skipped).
 */
export function track(action, props = {}) {
  if (!ANALYTICS_ENABLED) return Promise.resolve();

  const { props: clean, error } = validateProps(action, props);
  if (error) {
    console.warn(`[Analytics] Dropped "${action}": ${error}. New events/props must be added to EVENT_SCHEMAS here and on the server.`);
    return Promise.resolve();
  }

  return (async () => {
    if (!(await hasConsent())) return;
    const event = { id: crypto.randomUUID(), action, at: new Date().toISOString() };
    if (Object.keys(clean).length) event.props = clean;

    await withQueueLock(async () => {
      const queue = await readQueue();
      queue.push(event);
      // Drop the oldest events if we've been offline a long time.
      if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
      await writeKeys({ [QUEUE_KEY]: queue });
    });
    debugLog('Queued', event);
    scheduleFlush();
  })().catch((err) => debugLog('Track failed', err));
}

/** Removes every queued event, e.g. when the user withdraws consent. */
export function clearAnalyticsQueue() {
  return withQueueLock(() => removeKeys([QUEUE_KEY, LEGACY_EVENTS_KEY, RETRY_KEY])).catch(() => {});
}

let flushTimer = null;
function scheduleFlush() {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushAnalytics();
  }, FLUSH_DEBOUNCE_MS);
}

let inFlight = null;
let lastFlushAt = 0;

/**
 * Uploads queued events. Safe to call often: concurrent calls share one
 * upload, back-to-back calls are throttled, and failures back off exponentially.
 */
export function flushAnalytics({ force = false } = {}) {
  if (!ANALYTICS_ENABLED) return Promise.resolve();
  if (inFlight) return inFlight;
  if (!force && Date.now() - lastFlushAt < MIN_FLUSH_GAP_MS) return Promise.resolve();

  lastFlushAt = Date.now();
  inFlight = runFlush(force)
    .catch((err) => debugLog('Flush failed', err))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

async function runFlush(force) {
  if (!(await hasConsent())) {
    await clearAnalyticsQueue();
    return;
  }

  // Events queued by builds before the socket uploader have no ids and can't be deduped.
  await removeKeys([LEGACY_EVENTS_KEY]);

  const { [RETRY_KEY]: retry } = await readKeys([RETRY_KEY]);
  if (!force && retry?.at && Date.now() < retry.at) {
    debugLog('Upload backing off until', new Date(retry.at).toISOString());
    return;
  }

  if (!(await readQueue()).length) return;

  const outcome = await uploadOverSocket(await getClientId());
  debugLog('Upload finished', outcome);

  if (outcome.status === 'done') {
    await removeKeys([RETRY_KEY]);
  } else if (outcome.status === 'paused') {
    await writeKeys({ [RETRY_KEY]: { at: Date.now() + PAUSED_RETRY_MS, attempts: 0 } });
  } else {
    const attempts = (retry?.attempts || 0) + 1;
    const delay = Math.min(MAX_BACKOFF_MS, 60_000 * 2 ** (attempts - 1));
    const jitter = Math.random() * delay * 0.2;
    await writeKeys({ [RETRY_KEY]: { at: Date.now() + delay + jitter, attempts } });
  }
}

/**
 * Opens the socket, says hello, then sends batches one at a time, removing
 * each batch from the queue only after the server acks it. If anything goes
 * wrong mid-way the unacked events stay queued and the server dedupes any
 * that did land, so retrying is always safe.
 */
function uploadOverSocket(clientId) {
  return new Promise((resolve) => {
    let socket;
    let settled = false;
    let batchSize = BATCH_SIZE;
    let pendingIds = null;
    let sent = 0;
    let timer = null;

    const finish = (status, detail) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket?.close(1000);
      } catch {
        // Already closed.
      }
      resolve({ status, sent, detail });
    };
    const armTimeout = () => {
      clearTimeout(timer);
      timer = setTimeout(() => finish('error', 'timeout'), SOCKET_TIMEOUT_MS);
    };
    const send = (message) => socket.send(JSON.stringify(message));

    const sendNextBatch = async () => {
      const queue = await readQueue();
      if (!queue.length) return finish('done');
      const events = queue.slice(0, batchSize);
      pendingIds = new Set(events.map((event) => event.id));
      armTimeout();
      send({ type: 'batch', batchId: crypto.randomUUID(), events });
    };

    try {
      socket = new WebSocket(ANALYTICS_SOCKET_URL);
    } catch (err) {
      finish('error', String(err));
      return;
    }
    armTimeout();

    socket.addEventListener('open', () => {
      armTimeout();
      send({ type: 'hello', protocol: PROTOCOL_VERSION, clientId, extensionVersion: APP_VERSION });
    });

    socket.addEventListener('message', async (message) => {
      let data;
      try {
        data = JSON.parse(message.data);
      } catch {
        return finish('error', 'bad server message');
      }

      try {
        if (data.type === 'welcome') {
          batchSize = Math.max(1, Math.min(BATCH_SIZE, Number(data.maxBatchSize) || BATCH_SIZE));
          await sendNextBatch();
        } else if (data.type === 'ack' && pendingIds) {
          const acked = pendingIds;
          pendingIds = null;
          sent += acked.size;
          if (data.rejected && Object.keys(data.rejected).length) debugLog('Server rejected events', data.rejected);
          await withQueueLock(async () => {
            const queue = await readQueue();
            await writeKeys({ [QUEUE_KEY]: queue.filter((event) => !acked.has(event.id)) });
          });
          await sendNextBatch();
        } else if (data.type === 'paused') {
          finish('paused');
        } else if (data.type === 'error') {
          finish('error', data.message);
        }
      } catch (err) {
        finish('error', String(err));
      }
    });

    socket.addEventListener('error', () => finish('error', 'socket error'));
    socket.addEventListener('close', (event) => finish('error', `closed ${event.code}`));
  });
}
