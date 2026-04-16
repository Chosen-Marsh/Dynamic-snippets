/**
 * Storage Service for Chrome and Edge Web Extensions
 * Uses chrome.storage API (Manifest V3 compatible)
 */

class ExtensionStorage {
  constructor() {
    // Check if running in extension context
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.storage;
    
    if (!this.isExtensionContext) {
      console.warn('Extension storage API not available - falling back to localStorage');
    }
  }

  /**
   * Get data from sync storage
   * @param {string|string[]|object} keys - Keys to retrieve. Can be a string, array, or object with default values
   * @returns {Promise<object>} Data object with requested keys and values
   */
  async getSync(keys = null) {
    if (!this.isExtensionContext) {
      return this._getFromLocalStorage(keys);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result || {});
        }
      });
    });
  }

  /**
   * Get data from local storage
   * @param {string|string[]|object} keys - Keys to retrieve. Can be a string, array, or object with default values
   * @returns {Promise<object>} Data object with requested keys and values
   */
  async getLocal(keys = null) {
    if (!this.isExtensionContext) {
      return this._getFromLocalStorage(keys);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result || {});
        }
      });
    });
  }

  /**
   * Set data in sync storage
   * @param {object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async setSync(items) {
    if (!this.isExtensionContext) {
      return this._setInLocalStorage(items);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Set data in local storage
   * @param {object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async setLocal(items) {
    if (!this.isExtensionContext) {
      return this._setInLocalStorage(items);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Remove data from sync storage
   * @param {string|string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  async removeSync(keys) {
    if (!this.isExtensionContext) {
      return this._removeFromLocalStorage(keys);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Remove data from local storage
   * @param {string|string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  async removeLocal(keys) {
    if (!this.isExtensionContext) {
      return this._removeFromLocalStorage(keys);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clear all data from sync storage
   * @returns {Promise<void>}
   */
  async clearSync() {
    if (!this.isExtensionContext) {
      localStorage.clear();
      return;
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clear all data from local storage
   * @returns {Promise<void>}
   */
  async clearLocal() {
    if (!this.isExtensionContext) {
      localStorage.clear();
      return;
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get storage quota information
   * @returns {Promise<object>} Object with bytesInUse and quotaBytes
   */
  async getQuotaInfo() {
    if (!this.isExtensionContext) {
      return { bytesInUse: 0, quotaBytes: 5242880 }; // 5MB default
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve({
            bytesInUse,
            quotaBytes: chrome.storage.sync.QUOTA_BYTES || 102400 // 100KB for sync, 10MB for local
          });
        }
      });
    });
  }

  /**
   * Listen for storage changes
   * @param {function} callback - Function called when storage changes: (changes, areaName) => void
   * @returns {void}
   */
  onChanged(callback) {
    if (!this.isExtensionContext) {
      console.warn('Storage change listener not available in non-extension context');
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      callback(changes, areaName);
    });
  }

  /**
   * Get settings
   * @returns {Promise<object>} Settings object
   */
  async getSettings() {
    const data = await this.getSync('settings');
    return data.settings || {};
  }

  /**
   * Save settings
   * @param {object} settings - Settings object
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    await this.setSync({ settings });
  }

  // Private utility methods for fallback to localStorage

  /**
   * Fallback: Get from localStorage
   * @private
   */
  _getFromLocalStorage(keys) {
    const result = {};
    
    if (keys === null) {
      // Get all
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          result[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          result[key] = localStorage.getItem(key);
        }
      }
    } else if (typeof keys === 'string') {
      const value = localStorage.getItem(keys);
      try {
        result[keys] = value ? JSON.parse(value) : null;
      } catch {
        result[keys] = value;
      }
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        try {
          result[key] = value ? JSON.parse(value) : null;
        } catch {
          result[key] = value;
        }
      });
    } else if (typeof keys === 'object') {
      // Object with defaults
      Object.keys(keys).forEach(key => {
        const value = localStorage.getItem(key);
        try {
          result[key] = value ? JSON.parse(value) : keys[key];
        } catch {
          result[key] = value || keys[key];
        }
      });
    }
    
    return Promise.resolve(result);
  }

  /**
   * Fallback: Set in localStorage
   * @private
   */
  _setInLocalStorage(items) {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    return Promise.resolve();
  }

  /**
   * Fallback: Remove from localStorage
   * @private
   */
  _removeFromLocalStorage(keys) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => localStorage.removeItem(key));
    return Promise.resolve();
  }
}

// Export as singleton
export default new ExtensionStorage();
