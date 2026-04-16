import storage from './Storage';

const SETTINGS_KEY = 'extensionSettings';

const DEFAULTS = {
  theme: 'dark',
  debounceMs: 250
};

class Settings {
  async get() {
    const result = await storage.getLocal(SETTINGS_KEY);
    return { ...DEFAULTS, ...(result[SETTINGS_KEY] || {}) };
  }

  async save(settings) {
    const current = await this.get();
    const merged = { ...current, ...settings };
    await storage.setLocal({ [SETTINGS_KEY]: merged });
    return merged;
  }
}

export default new Settings();
export { DEFAULTS };
