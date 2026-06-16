import { snippetPayloadByMenuId, rebuildContextMenu, lookupSnippetContent } from './background/contextMenus.js';
import { resolveSnippetVariables } from './background/variableResolver.js';
import { resolveGlobalVariablesInText } from './background/resolveGlobalVariables.js';
import { insertSnippetText } from './background/snippetInserter.js';

const STORAGE_FOLDERS_KEY = 'snippetsFolders';
const STORAGE_SNIPPETS_KEY = 'snippets';
const GLOBAL_VARS_KEY = 'globalVariables';

async function getGlobalVariables() {
  const result = await chrome.storage.local.get(GLOBAL_VARS_KEY);
  const data = result[GLOBAL_VARS_KEY];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return { ...data };
}

let rebuildQueue = Promise.resolve();

function queueRebuildContextMenu() {
  rebuildQueue = rebuildQueue
    .then(() => rebuildContextMenu())
    .catch((error) => {
      console.error('Failed to rebuild context menu:', error);
    });
  return rebuildQueue;
}

chrome.runtime.onInstalled.addListener(() => {
  queueRebuildContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  queueRebuildContextMenu();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes[STORAGE_FOLDERS_KEY] || changes[STORAGE_SNIPPETS_KEY]) {
    queueRebuildContextMenu();
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.menuItemId || typeof info.menuItemId !== 'string') return;
  if (!info.menuItemId.startsWith('snippet:')) return;

  if (!tab?.id) return;
  if (typeof tab.url === 'string' && /^(chrome|edge):\/\//i.test(tab.url)) {
    console.warn('Snippet insertion is not supported on browser internal pages:', tab.url);
    return;
  }

  const target = { tabId: tab.id };
  if (typeof info.frameId === 'number' && info.frameId >= 0) {
    target.frameIds = [info.frameId];
  }

  const topFrameTarget = { tabId: tab.id, frameIds: [0] };

  const cachedText = snippetPayloadByMenuId.get(info.menuItemId);

  (typeof cachedText === 'string' ? Promise.resolve(cachedText) : lookupSnippetContent(info.menuItemId))
    .then(async (text) => {
      if (typeof text !== 'string') return;
      const globals = await getGlobalVariables();
      const textWithGlobals = resolveGlobalVariablesInText(text, globals);
      return chrome.scripting.executeScript({
        target: topFrameTarget,
        func: resolveSnippetVariables,
        args: [textWithGlobals]
      });
    })
    .then((results) => {
      const resolvedText = results?.[0]?.result;
      if (typeof resolvedText !== 'string') return;
      return chrome.scripting.executeScript({
        target,
        func: insertSnippetText,
        args: [resolvedText]
      });
    })
    .catch((error) => {
      console.error('Failed to insert snippet text:', error);
    });
});

queueRebuildContextMenu();