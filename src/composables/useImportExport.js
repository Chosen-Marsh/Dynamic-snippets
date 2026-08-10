import snippetPacks from '../services/SnippetPacks.js';

export function useImportExport(snippetManager, loadFolders) {
  async function exportData() {
    const json = await snippetPacks.exportPack();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dynamic-snippets-pack.v1.1.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function selectImportFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const text = await file.text();
        resolve(text);
      });
      input.click();
    });
  }

  async function getImportPreview(jsonString) {
    return snippetPacks.previewImport(jsonString, { checkMerge: true });
  }

  async function importData(jsonString, mode = 'merge') {
    await snippetPacks.importPack(jsonString, { mode });
    await loadFolders();
  }

  return { exportData, selectImportFile, getImportPreview, importData };
}
