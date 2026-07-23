<script setup>
import Snippets from '../services/Snippets.js';
import Footer from './Footer.vue';
import SettingsModal from './SettingsModal.vue';
import { useContextMenu } from '../composables/useContextMenu.js';
import { useDragAndDrop } from '../composables/useDragAndDrop.js';
import { ref, computed, onMounted, nextTick, watch } from 'vue';

const snippetManager = Snippets;

const props = defineProps({
  items: {
    type: Array,
    default: null
  },
  liveSnippet: {
    type: Object,
    default: null
  }
});

const emit = defineEmits([
  'select',
  'delete',
  'settings-saved',
  'settings-opened',
  'snippet-created',
  'folder-created',
  'import-completed',
  'export-completed'
]);

const showSettings = ref(false);
function openSettings() {
  showSettings.value = true;
  emit('settings-opened');
}
function onSettingsSaved(s) {
  emit('settings-saved', s);
}

const folders = ref([]);
const rootSnippets = ref([]);
const expanded = ref(new Set());
const activeId = ref(null);

async function loadFolders() {
    folders.value = await snippetManager.getSnippetsFolders();
    rootSnippets.value = await snippetManager.getSnippets();
}

// ── Context menu ──
const { ctxMenu, openContextMenu, openBodyContextMenu, closeContextMenu } = useContextMenu();

// ── Drag and drop ──
const {
  dragItem, dragOverId, rootDragOver,
  onDragStart, onDragOver, onDragLeave, onDrop,
  onRootDragOver, onRootDragLeave, onRootDrop, onDragEnd
} = useDragAndDrop(snippetManager, loadFolders);

async function onImportCompleted() {
  await loadFolders();
  emit('import-completed');
}

function onExportCompleted() {
  emit('export-completed');
}

// ── Tree ──
function toggleFolder(item) {
  const next = new Set(expanded.value);
  if (next.has(item.id)) {
    next.delete(item.id);
  } else {
    next.add(item.id);
  }
  expanded.value = next;
}

function handleClick(item) {
  if (item.type === 'folder') {
    toggleFolder(item);
  } else {
    activeId.value = item.id;
    emit('select', item);
  }
}

function findSnippetAncestorFolderIds(items, targetId, ancestors = []) {
  for (const item of items) {
    if (item.type === 'snippet' && String(item.id) === String(targetId)) {
      return ancestors;
    }
    if (item.type === 'folder' && item.children?.length) {
      const found = findSnippetAncestorFolderIds(item.children, targetId, [...ancestors, item.id]);
      if (found) return found;
    }
  }
  return null;
}

function activateSnippet(id) {
  if (!id) return;
  activeId.value = id;
  const items = props.items ?? [...folders.value, ...rootSnippets.value];
  const ancestorIds = findSnippetAncestorFolderIds(items, id);
  if (!ancestorIds?.length) return;
  const next = new Set(expanded.value);
  for (const folderId of ancestorIds) {
    next.add(folderId);
  }
  expanded.value = next;
}

function flatten(items, depth = 0) {
  const result = [];
  for (const item of items) {
    const isLiveSnippet =
      item.type === 'snippet' &&
      props.liveSnippet &&
      item.id === props.liveSnippet.id;

    result.push({
      ...item,
      name: isLiveSnippet ? props.liveSnippet.name : item.name,
      depth
    });
    if (item.type === 'folder' && item.children && expanded.value.has(item.id)) {
      result.push(...flatten(item.children, depth + 1));
    }
  }
  return result;
}

const tree = computed(() => flatten(props.items ?? [...folders.value, ...rootSnippets.value]));

// ── CRUD actions ──
async function createFolder(name, parentId = null) {
    await snippetManager.createSnippetFolder(name, parentId).catch((error) => {
        console.error('Error creating folder:', error);
    });
    await loadFolders();
    emit('folder-created');
}

async function createFolderFromMenu(parentId = null) {
    closeContextMenu();
    await createFolder('New Folder', parentId);
}

async function createSnippet(folderId) {
    closeContextMenu();
    await snippetManager.createSnippet({ name: 'Untitled Snippet', content: '' }, folderId).catch(console.error);
    await loadFolders();
    emit('snippet-created');
}

async function deleteFolder(item) {
    closeContextMenu();
    await snippetManager.deleteSnippetFolder(item.id).catch(console.error);
    await loadFolders();
}

async function deleteSnippet(item) {
  closeContextMenu();
  await snippetManager.deleteSnippet(item.id).catch(console.error);
  emit('delete', item);
  await loadFolders();
}

// ── Rename ──
const renaming = ref(null);
const renameValue = ref('');
const renameInput = ref(null);

function setRenameInput(el, itemId) {
  if (renaming.value === itemId) {
    renameInput.value = el;
  }
}

function startRename(item) {
    closeContextMenu();
    renaming.value = item.id;
    renameValue.value = item.name;
    nextTick(() => renameInput.value?.focus());
}

async function commitRename(item) {
    const val = renameValue.value.trim();
    if (val && val !== item.name) {
        if (item.type === 'snippet') {
            await snippetManager.renameSnippet(item.id, val).catch(console.error);
        } else {
            await snippetManager.renameSnippetFolder(item.id, val).catch(console.error);
        }
        await loadFolders();
    }
    renaming.value = null;
}

onMounted(() => loadFolders());

watch(
  () => props.liveSnippet?.id,
  (id) => {
    if (id) activateSnippet(id);
  },
  { immediate: true }
);

watch([folders, rootSnippets], () => {
  const id = props.liveSnippet?.id;
  if (id) activateSnippet(id);
});

defineExpose({ loadFolders });
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-header-label">Snippets</span>
    </div>

    <div
      class="sidebar-body"
      :class="{ 'sidebar-body--drag-over': rootDragOver && dragItem }"
      @dragover="onRootDragOver"
      @dragleave="onRootDragLeave"
      @drop="onRootDrop"
      @contextmenu="openBodyContextMenu"
    >
      <button
        v-for="item in tree"
        :key="item.id"
        class="tree-row"
        :class="{
          'tree-row--active': activeId === item.id,
          'tree-row--folder': item.type === 'folder',
          'tree-row--drag-over': dragOverId === item.id,
          'tree-row--drop-before': item.type === 'snippet' && dragOverId === item.id && dragItem?.type === 'snippet',
          'tree-row--dragging': dragItem && dragItem.id === item.id && dragItem.type === item.type
        }"
        :style="{ paddingLeft: `${10 + item.depth * 14}px` }"
        :draggable="item.type === 'folder' || item.type === 'snippet'"
        @click="handleClick(item)"
        @contextmenu.stop="openContextMenu($event, item)"
        @dragstart="onDragStart($event, item)"
        @dragover="onDragOver($event, item)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, item)"
        @dragend="onDragEnd"
      >
        <!-- Chevron for folders -->
        <span class="icon-chevron" :class="{ 'icon-chevron--open': expanded.has(item.id) }">
          <svg v-if="item.type === 'folder'" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>

        <!-- Folder icon -->
        <span v-if="item.type === 'folder'" class="icon-node icon-folder">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5.5A1.5 1.5 0 013.5 4h2.879a1.5 1.5 0 011.06.44l.622.621A1.5 1.5 0 009.12 5.5H12.5A1.5 1.5 0 0114 7v4.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12V5.5z" fill="currentColor"/>
          </svg>
        </span>

        <!-- File icon -->
        <span v-else class="icon-node icon-file">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.5 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            <path d="M9.5 1v4h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>

        <template v-if="renaming === item.id">
          <input
            :ref="(el) => setRenameInput(el, item.id)"
            class="rename-input"
            v-model="renameValue"
            @blur="commitRename(item)"
            @keyup.enter="commitRename(item)"
            @keyup.escape="renaming = null"
            @click.stop
          />
        </template>
        <span v-else class="tree-row-name">{{ item.name }}</span>
      </button>
    </div>

    <!-- Context menu -->
    <teleport to="body">
      <div
        v-if="ctxMenu.visible"
        class="ctx-backdrop"
        @mousedown="closeContextMenu"
      />
      <ul
        v-if="ctxMenu.visible"
        class="ctx-menu"
        :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }"
      >
        <li
          v-if="!ctxMenu.item || ctxMenu.item.type === 'folder'"
          class="ctx-item"
          @mousedown.prevent="createSnippet(ctxMenu.item?.type === 'folder' ? ctxMenu.item.id : null)"
        >
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.5 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            <path d="M9.5 1v4h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 8v4M6 10h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          New Snippet
        </li>
        <li
          v-if="!ctxMenu.item || ctxMenu.item.type === 'folder'"
          class="ctx-item"
          @mousedown.prevent="createFolderFromMenu(ctxMenu.item?.type === 'folder' ? ctxMenu.item.id : null)"
        >
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5.5A1.5 1.5 0 013.5 4h2.879a1.5 1.5 0 011.06.44l.622.621A1.5 1.5 0 009.12 5.5H12.5A1.5 1.5 0 0114 7v4.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12V5.5z" fill="currentColor"/>
            <path d="M8 7.5v3M6.5 9h3" stroke="var(--bg-elev-2)" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          New Folder
        </li>
        <template v-if="ctxMenu.item?.type === 'folder'">
          <li class="ctx-divider" />
          <li class="ctx-item" @mousedown.prevent="startRename(ctxMenu.item)">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            Rename
          </li>
          <li class="ctx-item ctx-item--danger" @mousedown.prevent="deleteFolder(ctxMenu.item)">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4h10M6 4V2h4v2M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Delete
          </li>
        </template>
        <template v-if="ctxMenu.item?.type === 'snippet'">
          <li class="ctx-item" @mousedown.prevent="startRename(ctxMenu.item)">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            Rename
          </li>
          <li class="ctx-item ctx-item--danger" @mousedown.prevent="deleteSnippet(ctxMenu.item)">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4h10M6 4V2h4v2M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Delete Snippet
          </li>
        </template>
      </ul>
    </teleport>
    <Footer @open-settings="openSettings" />
    <SettingsModal
      :visible="showSettings"
      @close="showSettings = false"
      @saved="onSettingsSaved"
      @import-completed="onImportCompleted"
      @export-completed="onExportCompleted"
    />
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  height: 100%;
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  user-select: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
}

.sidebar-header-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  transition: background 120ms ease;
}

.sidebar-body--drag-over {
  background: rgba(34, 197, 94, 0.06);
  outline: 1px dashed var(--accent);
  outline-offset: -2px;
}

.sidebar-body::-webkit-scrollbar {
  width: 4px;
}

.sidebar-body::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-body::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 99px;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-right: 10px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 0;
  transition: background-color 120ms ease, color 100ms ease;
}

.tree-row:hover {
  background: var(--bg-elev-2);
  color: var(--text);
}

.tree-row--active {
  background: rgba(34, 197, 94, 0.12);
  color: var(--accent);
}

.tree-row--active:hover {
  background: rgba(34, 197, 94, 0.16);
  color: var(--accent);
}

.tree-row--drag-over {
  background: rgba(34, 197, 94, 0.18);
  outline: 1px solid var(--accent);
  outline-offset: -1px;

.tree-row--drop-before {
  box-shadow: inset 0 2px 0 var(--accent);
}
}

.tree-row--dragging {
  opacity: 0.4;
}

.icon-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  color: var(--muted);
  transition: transform 150ms ease;
}

.icon-chevron svg {
  width: 12px;
  height: 12px;
}

.icon-chevron--open {
  transform: rotate(90deg);
}

.icon-node {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 15px;
  height: 15px;
}

.icon-node svg {
  width: 15px;
  height: 15px;
}

.icon-folder {
  color: #f59e0b;
}

.icon-file {
  color: #60a5fa;
}

.tree-row--folder .icon-folder {
  color: #fbbf24;
}

.tree-row-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.rename-input {
  flex: 1;
  background: var(--bg-elev-2);
  border: 1px solid var(--accent);
  border-radius: 3px;
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  padding: 1px 4px;
  outline: none;
  min-width: 0;
}

/* Context menu */
.ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.ctx-menu {
  position: fixed;
  z-index: 1000;
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px;
  list-style: none;
  margin: 0;
  min-width: 130px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
  transition: background 100ms ease;
}

.ctx-item svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--muted);
}

.ctx-item:hover {
  background: var(--bg-elev);
}

.ctx-item--danger {
  color: var(--danger);
}

.ctx-item--danger svg {
  color: var(--danger);
}

.ctx-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
</style>
