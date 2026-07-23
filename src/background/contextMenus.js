const ROOT_MENU_ID = 'dynamic-snippets-root';
const MENU_CONTEXTS = ['all'];

const snippetPayloadByMenuId = new Map();

function clipTitle(title, max = 60) {
  if (!title) return 'Untitled Snippet';
  return title.length > max ? `${title.slice(0, max - 1)}...` : title;
}

async function removeAllMenus() {
  await new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to clear menus before rebuild:', chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
  snippetPayloadByMenuId.clear();
}

function createMenu(options) {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(options, () => {
      if (!chrome.runtime.lastError) {
        resolve();
        return;
      }

      const message = chrome.runtime.lastError.message || 'Unknown context menu error';
      if (!message.includes('duplicate id')) {
        reject(new Error(message));
        return;
      }

      chrome.contextMenus.remove(options.id, () => {
        chrome.contextMenus.create(options, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Unknown context menu error'));
            return;
          }
          resolve();
        });
      });
    });
  });
}

function registerSnippetMenu(snippet, parentId = ROOT_MENU_ID) {
  const snippetId = `snippet:${snippet.id}`;
  snippetPayloadByMenuId.set(snippetId, snippet.content || '');

  return createMenu({
    id: snippetId,
    parentId,
    title: clipTitle(snippet.name),
    contexts: MENU_CONTEXTS
  });
}

function registerFolderMenus(folder, parentId = ROOT_MENU_ID) {
  const folderMenuId = `folder:${folder.id}`;

  const tasks = [createMenu({
    id: folderMenuId,
    parentId,
    title: clipTitle(folder.name),
    contexts: MENU_CONTEXTS
  })];

  const children = Array.isArray(folder.children) ? folder.children : [];
  for (const child of children) {
    if (child.type === 'folder') {
      tasks.push(registerFolderMenus(child, folderMenuId));
    } else if (child.type === 'snippet') {
      tasks.push(registerSnippetMenu(child, folderMenuId));
    }
  }

  return Promise.all(tasks);
}

async function getStoredTree() {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(['snippetsFolders', 'snippets'], resolve);
  });

  return {
    folders: Array.isArray(result.snippetsFolders) ? result.snippetsFolders : [],
    snippets: Array.isArray(result.snippets) ? result.snippets : []
  };
}

async function rebuildContextMenu() {
  await removeAllMenus();

  await createMenu({
    id: ROOT_MENU_ID,
    title: 'Insert Snippet',
    contexts: MENU_CONTEXTS
  });

  const { folders, snippets } = await getStoredTree();

  for (const folder of folders) {
    await registerFolderMenus(folder, ROOT_MENU_ID);
  }

  for (const snippet of snippets) {
    await registerSnippetMenu(snippet, ROOT_MENU_ID);
  }

  if (!folders.length && !snippets.length) {
    await createMenu({
      id: 'snippets-empty',
      parentId: ROOT_MENU_ID,
      title: 'No snippets available',
      contexts: MENU_CONTEXTS,
      enabled: false
    });
  }
}

function findSnippetContent(items, snippetId) {
  for (const item of items) {
    if (item.type === 'snippet' && String(item.id) === snippetId) return item.content || '';
    if (item.children?.length) {
      const found = findSnippetContent(item.children, snippetId);
      if (found !== null) return found;
    }
  }
  return null;
}

async function lookupSnippetContent(menuItemId) {
  const snippetId = menuItemId.replace(/^snippet:/, '');
  const { folders, snippets } = await getStoredTree();
  const fromRoot = snippets.find(s => String(s.id) === snippetId);
  if (fromRoot) return fromRoot.content || '';
  return findSnippetContent(folders, snippetId);
}

export { snippetPayloadByMenuId, rebuildContextMenu, lookupSnippetContent };
