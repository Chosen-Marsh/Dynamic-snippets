import storage from './Storage';

export const GLOBAL_VARS_KEY = 'globalVariables';

class GlobalVariables {
  async getAll() {
    const result = await storage.getLocal(GLOBAL_VARS_KEY);
    const data = result[GLOBAL_VARS_KEY];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return { ...data };
  }

  async saveAll(vars) {
    const cleaned = {};
    for (const [key, value] of Object.entries(vars)) {
      const k = String(key).trim();
      if (!k) continue;
      cleaned[k] = String(value ?? '');
    }
    await storage.setLocal({ [GLOBAL_VARS_KEY]: cleaned });
    return cleaned;
  }

  async get(key) {
    const all = await this.getAll();
    return all[key];
  }
}

export default new GlobalVariables();
