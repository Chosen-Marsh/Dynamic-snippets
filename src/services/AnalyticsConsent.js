const CONSENT_KEY = 'ds_analytics_consent';

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

function isConsentValue(value) {
  return value === 'granted' || value === 'denied';
}

export function getConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

export function hasConsentBeenSet() {
  return getConsent() !== null;
}

export function isAnalyticsEnabled() {
  return getConsent() === 'granted';
}

export async function hasConsentBeenSetAnywhere() {
  if (isConsentValue(getConsent())) {
    return true;
  }

  if (!canUseExtensionStorage()) {
    return false;
  }

  try {
    const result = await chrome.storage.local.get(CONSENT_KEY);
    return isConsentValue(result?.[CONSENT_KEY]);
  } catch {
    return false;
  }
}

export function setConsent(granted) {
  const value = granted ? 'granted' : 'denied';

  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Ignore local storage errors to avoid breaking settings save.
    }
  }

  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    chrome.storage.local.set({ [CONSENT_KEY]: value }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to persist analytics consent to extension storage:', chrome.runtime.lastError.message);
      }
    });
  }
}
