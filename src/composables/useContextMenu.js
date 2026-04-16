import { ref } from 'vue';

export function useContextMenu() {
  const ctxMenu = ref({ visible: false, x: 0, y: 0, item: null });

  function openContextMenu(e, item) {
    e.preventDefault();
    e.stopPropagation();
    ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, item };
  }

  function openBodyContextMenu(e) {
    e.preventDefault();
    ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, item: null };
  }

  function closeContextMenu() {
    ctxMenu.value.visible = false;
  }

  return {
    ctxMenu,
    openContextMenu,
    openBodyContextMenu,
    closeContextMenu
  };
}
