const CONSENT_KEY = 'ds_analytics_consent';
const EVENTS_KEY = 'ds_analytics_events';
const MAX_EVENTS = 500;
const DEBUG_ANALYTICS = true;
export const ANALYTICS_ENABLED = false; // Set to false to disable analytics tracking entirely

function debugLog(message, data) {
  if (!DEBUG_ANALYTICS) return;
  if (typeof data === 'undefined') {
    console.debug(`[Analytics] ${message}`);
    return;
  }
  console.debug(`[Analytics] ${message}`, data);
}

function canUseExtensionStorage() {
  return typeof chrome !== 'undefined' && chrome?.storage?.local;
}

function canUseLocalStorage() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function normalizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};

  const normalized = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = value;
    }
  }
  return normalized;
}

async function isAnalyticsEnabled() {
  let extensionConsent = null;
  let localConsent = null;

  if (canUseExtensionStorage()) {
    try {
      const result = await chrome.storage.local.get(CONSENT_KEY);
      extensionConsent = result?.[CONSENT_KEY] ?? null;
    } catch {
      extensionConsent = null;
    }
  }

  if (canUseLocalStorage()) {
    try {
      localConsent = localStorage.getItem(CONSENT_KEY);
    } catch {
      localConsent = null;
    }
  }

  const enabled = extensionConsent === 'granted' || localConsent === 'granted';
  debugLog('Consent check', { extensionConsent, localConsent, enabled });
  return enabled;
}

async function getStoredEvents() {
  let extensionEvents = [];
  let localEvents = [];

  if (canUseExtensionStorage()) {
    try {
      const result = await chrome.storage.local.get(EVENTS_KEY);
      extensionEvents = Array.isArray(result?.[EVENTS_KEY]) ? result[EVENTS_KEY] : [];
    } catch {
      extensionEvents = [];
    }
  }

  if (canUseLocalStorage()) {
    try {
      const parsed = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
      localEvents = Array.isArray(parsed) ? parsed : [];
    } catch {
      localEvents = [];
    }
  }

  // Prefer localStorage in popup UI, fall back to extension storage elsewhere.
  return localEvents.length ? localEvents : extensionEvents;
}

async function setStoredEvents(events) {
  let extensionSaved = false;
  let localSaved = false;

  if (canUseExtensionStorage()) {
    try {
      await chrome.storage.local.set({ [EVENTS_KEY]: events });
      extensionSaved = true;
    } catch {
      // Ignore storage errors — analytics should never block the app.
    }
  }

  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
      localSaved = true;
    } catch {
      // Ignore storage errors — analytics should never block the app.
    }
  }

  debugLog('Saved analytics events', {
    count: events.length,
    extensionStorage: extensionSaved,
    localStorage: localSaved
  });
}

export function track(action, metadata = {}) {
  if (!action || typeof action !== 'string') return;

  (async () => {
    const meta = normalizeMetadata(metadata);
    debugLog('Track called', { action, metadata: meta });

    if (!(await isAnalyticsEnabled())) {
      debugLog('Track skipped because analytics is disabled', { action });
      return;
    }

    const events = await getStoredEvents();
    events.push({ action, at: new Date().toISOString(), ...meta });

    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }

    await setStoredEvents(events);
  })();
}

export async function sendEventsToServer() {
  if (!(await isAnalyticsEnabled())) {
    debugLog('Send skipped because analytics is disabled');
    return;
  }

  const events = await getStoredEvents();
  if (!events.length) {
    debugLog('No events to send');
    return;
  }

  if (!ANALYTICS_ENABLED) {
    debugLog('Analytics sending is disabled by configuration', { count: events.length });
    return;
  }

  try {
    const response = await fetch('TODO_SET', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    debugLog('Events sent successfully', { count: events.length });
    await setStoredEvents([]);
  } catch (error) {
    console.error('Failed to send analytics events:', error);
  }
}
