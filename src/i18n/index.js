import { ref } from 'vue';
import { DEFAULT_LOCALE, hasLocale, translate, getSectionFor } from './core.js';

export { DEFAULT_LOCALE, getAvailableLocales, registerLocale } from './core.js';

const locale = ref(DEFAULT_LOCALE);

// Reads `locale.value`, so calls made during render re-run when the locale changes.
export function t(key, params = {}) {
  return translate(locale.value, key, params);
}

export function getLocale() {
  return locale.value;
}

export function setLocale(next) {
  if (!hasLocale(next)) return false;
  locale.value = next;
  return true;
}

export function getSection(section) {
  return getSectionFor(locale.value, section);
}

export const i18n = {
  install(app) {
    app.config.globalProperties.$t = t;
  }
};
