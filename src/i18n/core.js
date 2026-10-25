// Vue-free locale registry and lookup, shared by the popup (via ./index.js) and the background worker.

export const DEFAULT_LOCALE = 'en';

// Every file in ./locales is registered automatically; the file name is the locale code.
const modules = import.meta.glob('./locales/*.js', { eager: true });
const messages = {};
for (const [path, mod] of Object.entries(modules)) {
  const code = path.match(/\/([^/]+)\.js$/)[1];
  messages[code] = mod.default;
}

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict);
}

function displayName(code) {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code;
  } catch {
    return code;
  }
}

export function hasLocale(code) {
  return Boolean(messages[code]);
}

export function getAvailableLocales() {
  return Object.keys(messages)
    .sort()
    .map((code) => ({ code, name: displayName(code) }));
}

export function translate(code, key, params = {}) {
  let message = lookup(messages[code], key);
  if (typeof message !== 'string') message = lookup(messages[DEFAULT_LOCALE], key);
  if (typeof message !== 'string') return key;
  return message.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

// Flat string map for a top-level section, with English filling any gaps.
export function getSectionFor(code, section) {
  return { ...(messages[DEFAULT_LOCALE]?.[section] || {}), ...(messages[code]?.[section] || {}) };
}

export function registerLocale(code, dictionary) {
  messages[code] = dictionary;
}
