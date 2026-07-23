<template>
  <div class="snippet">
    <div class="snippet-header">
      <input
        type="text"
        name="title"
        v-model="title"
        class="snippet-title"
        placeholder="Untitled Snippet"
        spellcheck="false"
        draggable="false"
      />

      <button
        class="snippet-close"
        type="button"
        aria-label="Close snippet"
        title="Back to welcome"
        @click="emit('close')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div class="snippet-content">
      <textarea
        ref="snippetTextarea"
        name="content"
        v-model="content"
        class="snippet-textarea"
        placeholder="// paste or type your snippet here..."
        spellcheck="false"
        draggable="false"
        @contextmenu="openEditorContextMenu"
      />
    </div>

    <teleport to="body">
      <div
        v-if="editorCtxMenu.visible"
        class="editor-ctx-backdrop"
        @mousedown="closeEditorContextMenu"
      />
      <ul
        v-if="editorCtxMenu.visible"
        class="editor-ctx-menu"
        :style="{ top: editorCtxMenu.y + 'px', left: editorCtxMenu.x + 'px' }"
      >
        <li class="editor-ctx-item" @mousedown.prevent="openVarModal">
          Add Variable
        </li>
        <li class="editor-ctx-item" @mousedown.prevent="openGlobalVarModal">
          Add Global Variable
        </li>
      </ul>
    </teleport>

    <VarModal
      :visible="isVarModalOpen"
      @close="isVarModalOpen = false"
      @insert="insertVariableFromModal"
    />

    <GlobalVarModal
      :visible="isGlobalVarModalOpen"
      @close="isGlobalVarModalOpen = false"
      @insert="insertVariableFromModal"
    />

    <div class="status">
        <span class="snippet-dot" :style="{ background: content ? 'var(--accent)' : 'var(--muted)' }"></span>
        <span class="status-text">{{ saveStatusText }}</span>
    </div>
  </div>
</template>


<script setup>
import { ref, watch, onBeforeUnmount, onMounted, computed, nextTick } from 'vue';
import Snippets from '../services/Snippets.js';
import VarModal from './VarModal.vue';
import GlobalVarModal from './GlobalVarModal.vue';

const snippetManager = Snippets;

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  debounceMs: {
    type: Number,
    default: 250
  }
});

const emit = defineEmits(['update:title', 'update:content', 'close']);

const title = ref('Untitled Snippet');
const content = ref('');
const isHydrating = ref(false);
let saveTimer = null;
const currentSnippetId = ref(null);
const isSaving = ref(false);
const lastSavedAt = ref(null);
const hasPendingChanges = ref(false);
const snippetTextarea = ref(null);
const editorCtxMenu = ref({ visible: false, x: 0, y: 0, insertPos: 0 });
const isVarModalOpen = ref(false);
const isGlobalVarModalOpen = ref(false);
const variableInsertPos = ref(0);

watch(title, (val) => emit('update:title', val));
watch(content, (val) => emit('update:content', val));

const saveStatusText = computed(() => {
  if (isHydrating.value) return 'Loading...';
  if (isSaving.value) return 'Saving...';
  if (hasPendingChanges.value) return 'Unsaved changes';
  if (lastSavedAt.value) {
    const time = new Date(lastSavedAt.value).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    return `Last saved at ${time}`;
  }
  return 'Not saved yet';
});

async function persistSnippet(id) {
  if (!id) return;
  isSaving.value = true;
  try {
    const updated = await snippetManager.updateSnippetData(id, {
      name: title.value,
      content: content.value
    });
    lastSavedAt.value = updated?.updatedAt || new Date().toISOString();
    hasPendingChanges.value = false;
  } finally {
    isSaving.value = false;
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  hasPendingChanges.value = true;
  const idToSave = currentSnippetId.value;
  saveTimer = setTimeout(async () => {
    try {
      await persistSnippet(idToSave);
    } catch (error) {
      console.error('Error saving snippet:', error);
    } finally {
      saveTimer = null;
    }
  }, props.debounceMs);
}

async function flushPendingSave() {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    await persistSnippet(currentSnippetId.value);
  } catch (error) {
    console.error('Error saving snippet:', error);
  }
}

function openEditorContextMenu(e) {
  e.preventDefault();
  const textarea = snippetTextarea.value;
  editorCtxMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    insertPos: textarea?.selectionStart ?? content.value.length
  };
}

function closeEditorContextMenu() {
  editorCtxMenu.value.visible = false;
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape') closeEditorContextMenu();
}

function openVarModal() {
  variableInsertPos.value = editorCtxMenu.value.insertPos;
  closeEditorContextMenu();
  isVarModalOpen.value = true;
}

function openGlobalVarModal() {
  variableInsertPos.value = editorCtxMenu.value.insertPos;
  closeEditorContextMenu();
  isGlobalVarModalOpen.value = true;
}

function insertVariableFromModal(token) {
  if (!token) return;
  const start = Math.max(0, Math.min(variableInsertPos.value, content.value.length));
  content.value = `${content.value.slice(0, start)}${token}${content.value.slice(start)}`;
  isVarModalOpen.value = false;
  isGlobalVarModalOpen.value = false;

  nextTick(() => {
    const textarea = snippetTextarea.value;
    if (!textarea) return;
    const caret = start + token.length;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  });
}

async function fetchSnippet() {
    try {
    isHydrating.value = true;
    const snippet = await snippetManager.getSnippetData(props.id);
    currentSnippetId.value = props.id;
    title.value = snippet?.name || 'Untitled Snippet';
    content.value = snippet?.content || '';
  lastSavedAt.value = snippet?.updatedAt || null;
  hasPendingChanges.value = false;
    } catch (error) {
        console.error(error);
    } finally {
      isHydrating.value = false;
    }
}

fetchSnippet();

watch(() => props.id, async () => {
  await flushPendingSave();
  fetchSnippet();
});

watch([title, content], () => {
  if (isHydrating.value) return;
  scheduleSave();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  flushPendingSave();
});

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

</script>

<style scoped>
.snippet {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: var(--bg-elev);
  border-left: 1px solid var(--border);
  transition: border-color 200ms ease;
}

.snippet:focus-within {
  border-color: var(--accent);
}

/* ── Header ── */
.snippet-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  background: var(--bg-elev-2);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.snippet-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.snippet-title {
  flex: 1;
  margin-left: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.02em;
  caret-color: var(--accent);
  user-select: none;
  -webkit-user-drag: none;
}

.snippet-title::placeholder {
  color: var(--muted);
  font-weight: 400;
}

.snippet-close {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--muted);
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.snippet-close svg {
  width: 13px;
  height: 13px;
}

.snippet-close:hover {
  color: var(--text);
  border-color: var(--accent);
}

/* ── Body ── */
.snippet-content {
  flex: 1;
  display: flex;
}

.snippet-textarea {
  flex: 1;
  min-height: 0;
  height: 100%;
  padding: 12px 14px;
  background: none;
  border: none;
  outline: none;
  resize: none;
  color: var(--text);
  font-size: 12.5px;
  font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
  line-height: 1.65;
  caret-color: var(--accent);
  -webkit-user-drag: none;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) var(--bg-elev-2);
}

.snippet-textarea::placeholder {
  color: var(--muted);
  font-style: italic;
}

.snippet-textarea::-webkit-scrollbar {
  width: 10px;
}

.snippet-textarea::-webkit-scrollbar-track {
  background: var(--bg-elev-2);
  border-radius: 999px;
  margin: 6px 0;
}

.snippet-textarea::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 99px;
  border: 2px solid var(--bg-elev-2);
}

.snippet-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--accent-strong);
}

.status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--bg-elev-2);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
}

.status-text {
  font-size: 11px;
  color: var(--muted);
}

.editor-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.editor-ctx-menu {
  position: fixed;
  z-index: 1000;
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px;
  list-style: none;
  margin: 0;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.editor-ctx-item {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
  transition: background 100ms ease;
}

.editor-ctx-item:hover {
  background: var(--bg-elev);
}
</style>