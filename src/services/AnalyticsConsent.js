const CONSENT_KEY = 'ds_analytics_consent';

export function getConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

export function hasConsentBeenSet() {
  return getConsent() !== null;
}

export function isAnalyticsEnabled() {
  return getConsent() === 'granted';
}

export function setConsent(granted) {
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
}
