<script setup>
import Snippet from '../components/Snippet.vue';
import FolderTreeSideBar from '../components/FolderTreeSideBar.vue';
import Welcome from '../components/Welcome.vue';
import settings from '../services/Settings.js';
import Snippets from '../services/Snippets.js';
import { ref, computed, onMounted } from 'vue';

const sidebarRef = ref(null);
const snippetID = ref(null);
const snippetTitle = ref('');
const isRestoringSnippet = ref(true);
const currentSettings = ref({ theme: 'dark', debounceMs: 250 });

async function restoreLastOpenedSnippet() {
  try {
    const lastId = await Snippets.getLastOpenedSnippetId();
    if (!lastId) return;
    snippetID.value = lastId;
    const snippet = await Snippets.getSnippetData(lastId);
    if (!snippet) {
      snippetID.value = null;
      return;
    }
    snippetTitle.value = snippet.name || 'Untitled Snippet';
  } catch (err) {
    console.error('Failed to restore last opened snippet:', err);
  } finally {
    isRestoringSnippet.value = false;
  }
}

restoreLastOpenedSnippet();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

onMounted(async () => {
  const s = await settings.get();
  currentSettings.value = s;
  applyTheme(s.theme);
});

function onSettingsSaved(s) {
  currentSettings.value = s;
  applyTheme(s.theme);
}

const liveSnippet = computed(() => {
  if (!snippetID.value) return null;
  return {
    id: snippetID.value,
    name: snippetTitle.value
  };
});

function onFileSelect(file) {
  snippetID.value = file.id;
  snippetTitle.value = file.name || 'Untitled Snippet';
  Snippets.setLastOpenedSnippetId(file.id).catch(err => {
    console.error('Failed to set last opened snippet ID:', err);
  });
}

function onSnippetTitleUpdate(value) {
  snippetTitle.value = value;
  sidebarRef.value?.loadFolders();
}

function onSnippetDelete(item) {
  if (item.id === snippetID.value) {
    snippetID.value = null;
    snippetTitle.value = '';
  }
}
</script>

<template>
  <main class="popup popup-shell">
    <FolderTreeSideBar ref="sidebarRef" :live-snippet="liveSnippet" @select="onFileSelect" @delete="onSnippetDelete" @settings-saved="onSettingsSaved" />
    <Welcome v-if="!snippetID && !isRestoringSnippet" />
    <Snippet
      v-if="snippetID"
      :id="snippetID"
      :debounce-ms="currentSettings.debounceMs"
      class="snippet-pane"
      @update:title="onSnippetTitleUpdate"
    />
  </main>
</template>

<style scoped>
.popup-shell {
  display: flex;
  gap: 0;
  padding: 0;
  min-width: 600px;
  height: 450px;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: none;
}

.snippet-pane {
  flex: 1;
  min-width: 0;
}
</style>
