const INSTALL_AT_KEY = 'ds_installed_at';
const RATE_PROMPT_KEY = 'ds_rate_prompt_status';
const RATE_URL = 'https://chromewebstore.google.com/detail/lhpmacoeaepkocgkhamlnaalpifhckjm';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function canUseLocalStorage() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function canUseExtensionStorage() {
  return typeof chrome !== 'undefined' && chrome?.storage?.local;
}

function readFallback(key, fallback = null) {
  if (!canUseLocalStorage()) return fallback;

  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeFallback(key, value) {
  if (!canUseLocalStorage()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write errors to avoid breaking install tracking.
  }
}

async function readStorage(key, fallback = null) {
  if (canUseExtensionStorage()) {
    try {
      const result = await chrome.storage.local.get(key);
      return Object.prototype.hasOwnProperty.call(result, key)
        ? result[key]
        : fallback;
    } catch {
      // Fall back to localStorage if extension storage is unavailable.
    }
  }

  return readFallback(key, fallback);
}

async function writeStorage(items) {
  if (canUseExtensionStorage()) {
    await new Promise((resolve) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          console.warn('Failed to write storage value:', chrome.runtime.lastError.message);
        }
        resolve();
      });
    });
  }

  Object.entries(items).forEach(([key, value]) => writeFallback(key, value));
}

export async function ensureInstalledAt() {
  const existing = await readStorage(INSTALL_AT_KEY, null);
  if (existing !== null && existing !== undefined) {
    return Number(existing);
  }

  const installedAt = Date.now();
  await writeStorage({ [INSTALL_AT_KEY]: installedAt });
  return installedAt;
}

export async function getInstalledAt() {
  const value = await readStorage(INSTALL_AT_KEY, null);
  if (value === null || value === undefined || value === '') return null;

  const installedAt = Number(value);
  return Number.isFinite(installedAt) ? installedAt : null;
}

export async function shouldShowRatePrompt() {
  const installedAt = await getInstalledAt();
  if (installedAt === null) return false;

  const status = await readStorage(RATE_PROMPT_KEY, 'pending');
  if (status === 'accepted' || status === 'dismissed') {
    return false;
  }

  return Date.now() - installedAt >= ONE_DAY_MS;
}

export async function markRatePromptAccepted() {
  await writeStorage({ [RATE_PROMPT_KEY]: 'accepted' });
  return RATE_URL;
}

export async function markRatePromptDismissed() {
  await writeStorage({ [RATE_PROMPT_KEY]: 'dismissed' });
}

export { RATE_URL, ONE_DAY_MS };
