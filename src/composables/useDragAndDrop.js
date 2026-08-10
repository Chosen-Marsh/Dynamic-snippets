import { ref } from 'vue';

export function useDragAndDrop(snippetManager, loadFolders) {
  const dragItem = ref(null);
  const dragOverId = ref(null);
  const dropPosition = ref(null);
  const rootDragOver = ref(false);

  function onDragStart(e, item) {
    if (item.type !== 'folder' && item.type !== 'snippet') return;
    dragItem.value = { id: item.id, type: item.type };
    e.dataTransfer.effectAllowed = 'move';
  }

  function getDropPosition(e, item) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const threshold = rect.height * 0.35;

    if (item.type === 'folder') {
      if (offsetY < threshold) return 'before';
      if (offsetY > rect.height - threshold) return 'after';
      return 'inside';
    }

    return offsetY < rect.height / 2 ? 'before' : 'after';
  }

  function onDragOver(e, item) {
    if (!dragItem.value) return;
    const position = getDropPosition(e, item);

    if (item.type === 'snippet') {
      if (dragItem.value.type !== 'snippet' || item.id === dragItem.value.id) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      dragOverId.value = item.id;
      dropPosition.value = position;
      rootDragOver.value = false;
      return;
    }

    if (item.type !== 'folder') return;
    if (dragItem.value.type === 'folder' && item.id === dragItem.value.id) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    dragOverId.value = item.id;
    dropPosition.value = position;
    rootDragOver.value = false;
  }

  function onDragLeave() {
    dragOverId.value = null;
    dropPosition.value = null;
  }

  async function onDrop(e, item) {
    e.preventDefault();
    e.stopPropagation();
    const position = dropPosition.value;
    dragOverId.value = null;
    dropPosition.value = null;
    if (!dragItem.value) return;

    if (item.type === 'snippet') {
      if (dragItem.value.type !== 'snippet' || item.id === dragItem.value.id) return;
      if (position === 'after') {
        await snippetManager.moveSnippetAfter(dragItem.value.id, item.id).catch(console.error);
      } else {
        await snippetManager.moveSnippetBefore(dragItem.value.id, item.id).catch(console.error);
      }
      dragItem.value = null;
      await loadFolders();
      return;
    }

    if (item.type !== 'folder') return;
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
    dropPosition.value = 'root';
  }

  function onRootDragLeave() {
    rootDragOver.value = false;
    dropPosition.value = null;
  }

  async function onRootDrop(e) {
    e.preventDefault();
    rootDragOver.value = false;
    dropPosition.value = null;
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
    dropPosition.value = null;
    rootDragOver.value = false;
  }

  return {
    dragItem,
    dragOverId,
    dropPosition,
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
