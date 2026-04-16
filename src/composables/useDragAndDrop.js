import { ref } from 'vue';

export function useDragAndDrop(snippetManager, loadFolders) {
  const dragItem = ref(null);
  const dragOverId = ref(null);
  const rootDragOver = ref(false);

  function onDragStart(e, item) {
    if (item.type !== 'folder' && item.type !== 'snippet') return;
    dragItem.value = { id: item.id, type: item.type };
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, item) {
    if (item.type !== 'folder' || !dragItem.value) return;
    if (dragItem.value.type === 'folder' && item.id === dragItem.value.id) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    dragOverId.value = item.id;
    rootDragOver.value = false;
  }

  function onDragLeave() {
    dragOverId.value = null;
  }

  async function onDrop(e, item) {
    e.preventDefault();
    e.stopPropagation();
    dragOverId.value = null;
    if (!dragItem.value || item.type !== 'folder') return;
    if (dragItem.value.type === 'folder' && item.id === dragItem.value.id) return;

    if (dragItem.value.type === 'folder') {
      await snippetManager.moveSnippetFolder(dragItem.value.id, item.id).catch(console.error);
    } else {
      await snippetManager.moveSnippet(dragItem.value.id, item.id).catch(console.error);
    }

    dragItem.value = null;
    await loadFolders();
  }

  function onRootDragOver(e) {
    if (!dragItem.value) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    rootDragOver.value = true;
    dragOverId.value = null;
  }

  function onRootDragLeave() {
    rootDragOver.value = false;
  }

  async function onRootDrop(e) {
    e.preventDefault();
    rootDragOver.value = false;
    if (!dragItem.value) return;

    if (dragItem.value.type === 'folder') {
      await snippetManager.moveSnippetFolder(dragItem.value.id, null).catch(console.error);
    } else {
      await snippetManager.moveSnippet(dragItem.value.id, null).catch(console.error);
    }

    dragItem.value = null;
    await loadFolders();
  }

  function onDragEnd() {
    dragItem.value = null;
    dragOverId.value = null;
    rootDragOver.value = false;
  }

  return {
    dragItem,
    dragOverId,
    rootDragOver,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onRootDragOver,
    onRootDragLeave,
    onRootDrop,
    onDragEnd
  };
}
