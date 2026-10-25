import { snippetPayloadByMenuId, rebuildContextMenu, lookupSnippetContent } from './background/contextMenus.js';
import { resolveSnippetVariables } from './background/variableResolver.js';
import { resolveGlobalVariablesInText } from './background/resolveGlobalVariables.js';
import { insertSnippetText } from './background/snippetInserter.js';
import { track } from './services/Analytics.js';
import { ensureInstalledAt } from './services/InstallTracking.js';
import { hasVariableTokens } from './variables/tokenParser.js';
import { getBackgroundMessages, getContentMessages, SETTINGS_KEY } from './background/messages.js';

const STORAGE_FOLDERS_KEY = 'snippetsFolders';
const STORAGE_SNIPPETS_KEY = 'snippets';
const GLOBAL_VARS_KEY = 'globalVariables';
const CONTENT_MESSAGES_KEY = 'contentMessages';
const GLOBAL_TOKEN_REGEX = /\$\{[a-zA-Z0-9_-]+-global\}/;
const VARIABLE_MODAL_REQUEST = 'dynamic-snippets:request-variable-modal';
const VARIABLE_MODAL_DISPLAY = 'dynamic-snippets:show-variable-modal';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== VARIABLE_MODAL_REQUEST) return;
  if (typeof sender.tab?.id !== 'number' || sender.frameId === 0 || typeof message.rawText !== 'string' || !Array.isArray(message.variables)) {
    sendResponse({ result: null });
    return;
  }

  chrome.tabs.sendMessage(sender.tab.id, {
    type: VARIABLE_MODAL_DISPLAY,
    rawText: message.rawText,
    variables: message.variables
  }, { frameId: 0 })
    .then(sendResponse)
    .catch(() => sendResponse({ result: null }));
  return true;
});

function getSnippetAnalyticsFlags(rawText) {
  if (typeof rawText !== 'string') {
    return { hasVariables: false, hasGlobals: false };
  }

  return {
    hasVariables: hasVariableTokens(rawText),
    hasGlobals: GLOBAL_TOKEN_REGEX.test(rawText)
  };
}

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

chrome.runtime.onInstalled.addListener(async () => {
  await ensureInstalledAt();
  queueRebuildContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  queueRebuildContextMenu();
});

// The content script can't import locale files, so keep its strings in storage in sync with the language.
async function syncContentMessages() {
  try {
    const [next, stored] = await Promise.all([
      getContentMessages(),
      chrome.storage.local.get(CONTENT_MESSAGES_KEY)
    ]);
    if (JSON.stringify(stored[CONTENT_MESSAGES_KEY]) !== JSON.stringify(next)) {
      await chrome.storage.local.set({ [CONTENT_MESSAGES_KEY]: next });
    }
  } catch (error) {
    console.error('Failed to sync content messages:', error);
  }
}

syncContentMessages();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  let rebuild = Boolean(changes[STORAGE_FOLDERS_KEY] || changes[STORAGE_SNIPPETS_KEY]);

  if (changes[SETTINGS_KEY]) {
    const before = changes[SETTINGS_KEY].oldValue?.language;
    const after = changes[SETTINGS_KEY].newValue?.language;
    if (before !== after) {
      syncContentMessages();
      rebuild = true;
    }
  }

  if (rebuild) queueRebuildContextMenu();
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

  (async () => {
    try {
      const text = typeof cachedText === 'string' ? cachedText : await lookupSnippetContent(info.menuItemId);
      if (typeof text !== 'string') return;

      const analyticsFlags = getSnippetAnalyticsFlags(text);
      const globals = await getGlobalVariables();
      const textWithGlobals = resolveGlobalVariablesInText(text, globals);

      const [contentMessages, backgroundMessages] = await Promise.all([
        getContentMessages(),
        getBackgroundMessages()
      ]);

      const results = await chrome.scripting.executeScript({
        target: topFrameTarget,
        func: resolveSnippetVariables,
        args: [textWithGlobals, contentMessages]
      });

      const resolvedText = results?.[0]?.result;
      if (typeof resolvedText !== 'string') return;

      await chrome.scripting.executeScript({
        target,
        func: insertSnippetText,
        args: [resolvedText, backgroundMessages]
      });

      track('context_menu_inserted', {
        source: 'context_menu',
        hasVariables: analyticsFlags.hasVariables,
        hasGlobals: analyticsFlags.hasGlobals
      });
    } catch (error) {
      console.error('Failed to insert snippet text:', error);
    }
  })();
});

queueRebuildContextMenu();