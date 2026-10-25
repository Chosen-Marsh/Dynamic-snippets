import { DEFAULT_LOCALE, hasLocale, getSectionFor } from '../i18n/core.js';

const SETTINGS_KEY = 'extensionSettings';

export async function getActiveLocale() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const language = result[SETTINGS_KEY]?.language;
    return hasLocale(language) ? language : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getBackgroundMessages() {
  return getSectionFor(await getActiveLocale(), 'background');
}

export async function getContentMessages() {
  return getSectionFor(await getActiveLocale(), 'content');
}

export { SETTINGS_KEY };
