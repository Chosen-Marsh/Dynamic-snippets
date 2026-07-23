<script setup>
import Snippet from '../components/Snippet.vue';
import FolderTreeSideBar from '../components/FolderTreeSideBar.vue';
import Welcome from '../components/Welcome.vue';
import ChangelogPanel from '../components/ChangelogPanel.vue';
import AnalyticsConsentModal from '../components/AnalyticsConsentModal.vue';
import settings from '../services/Settings.js';
import Snippets from '../services/Snippets.js';
import changelogState from '../services/ChangeLogState.js';
import { APP_VERSION } from '../version.js';
import { getAllChangelogs, getChangelogByVersion } from '../changelogs/index.js';
import { hasConsentBeenSetAnywhere, setConsent } from '../services/AnalyticsConsent.js';
import { ANALYTICS_ENABLED, track } from '../services/Analytics.js';
import { ref, computed, onMounted } from 'vue';

const sidebarRef = ref(null);
const snippetID = ref(null);
const snippetTitle = ref('');
const isRestoringSnippet = ref(true);
const showConsentModal = ref(false);
const currentSettings = ref({ theme: 'dark', debounceMs: 250 });
const currentChangelog = ref(null);
const showChangelog = ref(false);
const showVersionHistory = ref(false);
const allChangelogs = ref([]);

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

  if (!ANALYTICS_ENABLED) {
    showConsentModal.value = false;
  } else {
    const consentSet = await hasConsentBeenSetAnywhere();
    showConsentModal.value = !consentSet;
  }

  const availableChangelog = getChangelogByVersion(APP_VERSION);
  allChangelogs.value = getAllChangelogs();
  if (availableChangelog) {
    currentChangelog.value = availableChangelog;
    const seenVersion = await changelogState.getSeenVersion();
    showChangelog.value = seenVersion !== APP_VERSION;
  }

  if (!showConsentModal.value) {
    track('popup_opened');
  }
});

function onConsentAccept() {
  setConsent(true);
  showConsentModal.value = false;
  track('consent_granted');
  track('popup_opened');
}

function onConsentDecline() {
  setConsent(false);
  showConsentModal.value = false;
}

function onSettingsSaved(s) {
  currentSettings.value = s;
  applyTheme(s.theme);
  track('settings_saved');
}

function onAnalyticsEvent(action) {
  track(action);
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
  track('snippet_opened');
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
  track('snippet_deleted');
}

function onSnippetClose() {
  snippetID.value = null;
  snippetTitle.value = '';
  Snippets.clearLastOpenedSnippetId().catch(err => {
    console.error('Failed to clear last opened snippet ID:', err);
  });
  track('snippet_closed');
}

async function dismissChangelog() {
  showChangelog.value = false;
  await changelogState.setSeenVersion(APP_VERSION);
  track('changelog_dismissed', { version: APP_VERSION });
}

function openVersionHistory() {
  showVersionHistory.value = true;
  track('version_history_opened');
}

function closeVersionHistory() {
  showVersionHistory.value = false;
}
</script>

<template>
  <main class="popup popup-shell">
    <AnalyticsConsentModal
      :visible="showConsentModal"
      @accept="onConsentAccept"
      @decline="onConsentDecline"
    />
    <FolderTreeSideBar
      ref="sidebarRef"
      :live-snippet="liveSnippet"
      @select="onFileSelect"
      @delete="onSnippetDelete"
      @settings-saved="onSettingsSaved"
      @settings-opened="() => onAnalyticsEvent('settings_opened')"
      @snippet-created="() => onAnalyticsEvent('snippet_created')"
      @folder-created="() => onAnalyticsEvent('folder_created')"
      @import-completed="() => onAnalyticsEvent('snippets_imported')"
      @export-completed="() => onAnalyticsEvent('snippets_exported')"
    />
    <ChangelogPanel
      v-if="!snippetID && !isRestoringSnippet && (showChangelog || showVersionHistory)"
      :changelog="currentChangelog"
      :history="allChangelogs"
      :history-mode="showVersionHistory && !showChangelog"
      @dismiss="dismissChangelog"
      @close-history="closeVersionHistory"
    />
    <Welcome
      v-else-if="!snippetID && !isRestoringSnippet"
      @view-history="openVersionHistory"
    />
    <Snippet
      v-if="snippetID"
      :id="snippetID"
      :debounce-ms="currentSettings.debounceMs"
      class="snippet-pane"
      @update:title="onSnippetTitleUpdate"
      @close="onSnippetClose"
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
