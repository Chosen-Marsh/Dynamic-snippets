import snippetsService from './Snippets.js';
import globalVariables from './GlobalVariables.js';
import settings from './Settings.js';
import { APP_VERSION } from '../version.js';

const SCHEMA_VERSION = '1.1.0';
const SUPPORTED_SCHEMA_MAJOR = 1;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function majorFromSemver(version) {
  const [major] = String(version || '').split('.');
  return toNumber(major, 0);
}

function asObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function asString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function normalizeSnippet(raw, now) {
  const source = asObject(raw);
  return {
    id: source.id,
    type: 'snippet',
    name: asString(source.name, 'Untitled Snippet'),
    content: asString(source.content, ''),
    createdAt: asString(source.createdAt, now),
    updatedAt: asString(source.updatedAt, now)
  };
}

function normalizeFolder(raw, now) {
  const source = asObject(raw);
  const children = Array.isArray(source.children) ? source.children : [];

  return {
    id: source.id,
    type: 'folder',
    name: asString(source.name, 'Untitled Folder'),
    createdAt: asString(source.createdAt, now),
    updatedAt: asString(source.updatedAt, now),
    children: normalizeItems(children, now)
  };
}

function normalizeItems(items, now) {
  if (!Array.isArray(items)) return [];

  const normalized = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    if (item.type === 'folder') {
      normalized.push(normalizeFolder(item, now));
      continue;
    }
    normalized.push(normalizeSnippet(item, now));
  }

  return normalized;
}

function collectIds(items, ids = new Set()) {
  for (const item of items) {
    ids.add(String(item.id));
    if (item.type === 'folder' && Array.isArray(item.children) && item.children.length) {
      collectIds(item.children, ids);
    }
  }
  return ids;
}

function remapIds(items, usedIds) {
  const queue = [...items];
  while (queue.length) {
    const item = queue.shift();
    if (!item) continue;

    let candidate = String(item.id ?? '');
    if (!candidate || usedIds.has(candidate)) {
      let generated;
      do {
        generated = String(Date.now()) + String(Math.floor(Math.random() * 100000));
      } while (usedIds.has(generated));
      candidate = generated;
    }

    item.id = Number(candidate);
    usedIds.add(String(item.id));

    if (item.type === 'folder' && Array.isArray(item.children) && item.children.length) {
      queue.push(...item.children);
    }
  }
}

function validateImportData(data) {
  const errors = [];
  const warnings = [];

  const allItems = [...data.snippets, ...data.folders];
  const ids = new Set();
  let duplicateIds = 0;

  const queue = [...allItems];
  while (queue.length) {
    const item = queue.shift();
    if (!item) continue;

    const idKey = String(item.id ?? '');
    if (!idKey) {
      warnings.push('Some imported items were missing IDs and will be regenerated.');
    } else if (ids.has(idKey)) {
      duplicateIds += 1;
    } else {
      ids.add(idKey);
    }

    if (!String(item.name || '').trim()) {
      warnings.push('Some imported items were missing names and were normalized.');
    }

    if (item.type === 'folder' && Array.isArray(item.children) && item.children.length) {
      queue.push(...item.children);
    }
  }

  if (duplicateIds > 0) {
    warnings.push(`${duplicateIds} duplicate IDs detected in the import file.`);
  }

  const totalSnippets = data.snippets.length + countFolderStats(data.folders).snippetsCount;
  const totalFolders = countFolderStats(data.folders).foldersCount;
  const totalVars = Object.keys(data.globalVariables).length;

  if (totalSnippets === 0 && totalFolders === 0 && totalVars === 0) {
    errors.push('Import file does not contain snippets, folders, or global variables.');
  }

  return {
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)]
  };
}

function parsePack(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Import file must be a JSON object.');
  }

  if (!parsed.schemaVersion && (Array.isArray(parsed.snippets) || Array.isArray(parsed.folders))) {
    return {
      schemaVersion: '0.legacy',
      exportedAt: null,
      appVersion: null,
      data: {
        snippets: Array.isArray(parsed.snippets) ? parsed.snippets : [],
        folders: Array.isArray(parsed.folders) ? parsed.folders : [],
        globalVariables: {},
        settings: {}
      }
    };
  }

  const schemaVersion = asString(parsed.schemaVersion);
  if (!schemaVersion) {
    throw new Error('Import file is missing schemaVersion.');
  }

  const major = majorFromSemver(schemaVersion);
  if (major !== SUPPORTED_SCHEMA_MAJOR) {
    throw new Error(`Unsupported schema version: ${schemaVersion}`);
  }

  const data = asObject(parsed.data);
  if (!Object.keys(data).length) {
    throw new Error('Import file is missing data payload.');
  }

  return {
    schemaVersion,
    exportedAt: parsed.exportedAt || null,
    appVersion: parsed.appVersion || null,
    data
  };
}

function sanitizePackData(rawData) {
  const now = new Date().toISOString();
  const snippets = normalizeItems(Array.isArray(rawData.snippets) ? rawData.snippets : [], now)
    .filter((item) => item.type === 'snippet');
  const folders = normalizeItems(Array.isArray(rawData.folders) ? rawData.folders : [], now)
    .filter((item) => item.type === 'folder');

  const varsRaw = asObject(rawData.globalVariables);
  const globalVars = {};
  for (const [key, value] of Object.entries(varsRaw)) {
    const cleanKey = String(key).trim();
    if (!cleanKey) continue;
    globalVars[cleanKey] = asString(value, '');
  }

  const settingsRaw = asObject(rawData.settings);
  const cleanedSettings = {};
  if (settingsRaw.theme === 'dark' || settingsRaw.theme === 'light') {
    cleanedSettings.theme = settingsRaw.theme;
  }
  if (settingsRaw.debounceMs !== undefined) {
    const debounceMs = toNumber(settingsRaw.debounceMs, 250);
    cleanedSettings.debounceMs = Math.min(5000, Math.max(50, debounceMs));
  }

  return {
    snippets,
    folders,
    globalVariables: globalVars,
    settings: cleanedSettings
  };
}

function countFolderStats(folders) {
  let foldersCount = 0;
  let snippetsCount = 0;

  const walk = (items) => {
    for (const item of items) {
      if (item.type === 'folder') {
        foldersCount += 1;
        if (Array.isArray(item.children) && item.children.length) {
          walk(item.children);
        }
      } else {
        snippetsCount += 1;
      }
    }
  };

  walk(folders);
  return { foldersCount, snippetsCount };
}

class SnippetPacks {
  async exportPack() {
    const [snippets, folders, vars, extensionSettings] = await Promise.all([
      snippetsService.getSnippets(),
      snippetsService.getSnippetsFolders(),
      globalVariables.getAll(),
      settings.get()
    ]);
    const defaults = snippetsService.getDefaultSeedContent();

    const payload = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      data: {
        snippets,
        folders,
        defaults,
        globalVariables: vars,
        settings: extensionSettings
      }
    };

    return JSON.stringify(payload, null, 2);
  }

  async previewImport(jsonString, options = {}) {
    const checkMerge = Boolean(options.checkMerge);
    const parsed = parsePack(jsonString);
    const data = sanitizePackData(parsed.data);
    const validation = validateImportData(data);

    const rootSnippetCount = data.snippets.length;
    const folderStats = countFolderStats(data.folders);
    const globalVarCount = Object.keys(data.globalVariables).length;

    let mergeCheck = null;
    if (checkMerge) {
      const [existingSnippets, existingFolders, existingVars] = await Promise.all([
        snippetsService.getSnippets(),
        snippetsService.getSnippetsFolders(),
        globalVariables.getAll()
      ]);

      const incomingIds = collectIds([...data.snippets, ...data.folders]);
      const existingIds = collectIds([...existingSnippets, ...existingFolders]);
      let idConflicts = 0;
      for (const id of incomingIds) {
        if (existingIds.has(id)) idConflicts += 1;
      }

      const existingVarKeys = new Set(Object.keys(existingVars));
      const incomingVarKeys = Object.keys(data.globalVariables);
      const variableConflicts = incomingVarKeys.filter((key) => existingVarKeys.has(key)).length;

      mergeCheck = {
        idConflicts,
        variableConflicts,
        settingsChanges: Object.keys(data.settings).length
      };
    }

    return {
      schemaVersion: parsed.schemaVersion,
      appVersion: parsed.appVersion,
      exportedAt: parsed.exportedAt,
      validation,
      mergeCheck,
      counts: {
        rootSnippets: rootSnippetCount,
        nestedSnippets: folderStats.snippetsCount,
        totalSnippets: rootSnippetCount + folderStats.snippetsCount,
        folders: folderStats.foldersCount,
        globalVariables: globalVarCount,
        settings: Object.keys(data.settings).length
      }
    };
  }

  async importPack(jsonString, options = {}) {
    const mode = options.mode === 'overwrite' ? 'overwrite' : 'merge';
    const parsed = parsePack(jsonString);
    const incoming = sanitizePackData(parsed.data);

    if (mode === 'overwrite') {
      await Promise.all([
        snippetsService.replaceAll({ snippets: incoming.snippets, folders: incoming.folders }),
        globalVariables.saveAll(incoming.globalVariables),
        settings.save(incoming.settings)
      ]);
      return { mode };
    }

    const [existingSnippets, existingFolders, existingVars] = await Promise.all([
      snippetsService.getSnippets(),
      snippetsService.getSnippetsFolders(),
      globalVariables.getAll()
    ]);

    const clonedSnippets = structuredClone(incoming.snippets);
    const clonedFolders = structuredClone(incoming.folders);

    const usedIds = collectIds([...existingSnippets, ...existingFolders]);
    remapIds(clonedSnippets, usedIds);
    remapIds(clonedFolders, usedIds);

    const mergedSnippets = [...existingSnippets, ...clonedSnippets];
    const mergedFolders = [...existingFolders, ...clonedFolders];
    const mergedVars = { ...existingVars, ...incoming.globalVariables };

    await Promise.all([
      snippetsService.replaceAll({ snippets: mergedSnippets, folders: mergedFolders }),
      globalVariables.saveAll(mergedVars),
      settings.save(incoming.settings)
    ]);

    return { mode };
  }
}

export default new SnippetPacks();
