export function useImportExport(snippetManager, loadFolders) {
  async function exportData() {
    const json = await snippetManager.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dynamic-snippets-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      await snippetManager.importAll(text);
      await loadFolders();
    });
    input.click();
  }

  return { exportData, importData };
}
