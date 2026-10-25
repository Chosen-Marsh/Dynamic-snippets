<script setup>
import Snippet from '../components/Snippet.vue';
import FolderTreeSideBar from '../components/FolderTreeSideBar.vue';
import Welcome from '../components/Welcome.vue';
import ChangelogPanel from '../components/ChangelogPanel.vue';
import AnalyticsConsentModal from '../components/AnalyticsConsentModal.vue';
import RatePromptModal from '../components/RatePromptModal.vue';
import settings from '../services/Settings.js';
import Snippets from '../services/Snippets.js';
import changelogState from '../services/ChangeLogState.js';
import { APP_VERSION } from '../version.js';
import { getAllChangelogs, getChangelogByVersion } from '../changelogs/index.js';
import { hasConsentBeenSetAnywhere, setConsent } from '../services/AnalyticsConsent.js';
import { ANALYTICS_ENABLED, track } from '../services/Analytics.js';
import { ensureInstalledAt, shouldShowRatePrompt, markRatePromptAccepted, markRatePromptDismissed, RATE_URL } from '../services/InstallTracking.js';
import { ref, computed, onMounted } from 'vue';
import { t, setLocale, getSection } from '../i18n/index.js';
import storage from '../services/Storage.js';

const sidebarRef = ref(null);
const snippetID = ref(null);
const snippetTitle = ref('');
const isRestoringSnippet = ref(true);
const showConsentModal = ref(false);
const showRatePrompt = ref(false);
const currentSettings = ref({ theme: 'dark', debounceMs: 250 });
const currentChangelog = ref(null);
const showChangelog = ref(false);
const showVersionHistory = ref(false);
const allChangelogs = ref([]);

async function restoreLastOpenedSnippet() {
  isRestoringSnippet.value = true;
  try {
    const lastId = await Snippets.getLastOpenedSnippetId();
    if (!lastId) return;
    snippetID.value = lastId;
    const snippet = await Snippets.getSnippetData(lastId);
    if (!snippet) {
      snippetID.value = null;
      return;
    }
    snippetTitle.value = snippet.name || t('snippet.untitled');
  } catch (err) {
    console.error('Failed to restore last opened snippet:', err);
  } finally {
    isRestoringSnippet.value = false;
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyLanguage(language) {
  setLocale(language);
  // The content script can't import the i18n module, so it reads its strings from storage.
  storage.setLocal({ contentMessages: getSection('content') }).catch((err) => {
    console.error('Failed to sync content messages:', err);
  });
}

async function maybeShowRatePrompt() {
  if (showConsentModal.value || showChangelog.value || showRatePrompt.value) return;
  showRatePrompt.value = await shouldShowRatePrompt();
}

onMounted(async () => {
  await ensureInstalledAt();

  const s = await settings.get();
  currentSettings.value = s;
  applyTheme(s.theme);
  applyLanguage(s.language);

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

  if (showChangelog.value) {
    isRestoringSnippet.value = false;
  } else {
    await restoreLastOpenedSnippet();
  }

  await maybeShowRatePrompt();

  if (!showConsentModal.value) {
    track('popup_opened');
  }
});

function onConsentAccept() {
  setConsent(true);
  showConsentModal.value = false;
  maybeShowRatePrompt();
  track('consent_granted');
  track('popup_opened');
}

function onConsentDecline() {
  setConsent(false);
  showConsentModal.value = false;
  maybeShowRatePrompt();
}

function onSettingsSaved(s) {
  currentSettings.value = s;
  applyTheme(s.theme);
  applyLanguage(s.language);
  track('settings_saved');
}

function onAnalyticsEvent(action) {
  track(action);
}

async function onRateAccept() {
  showRatePrompt.value = false;
  await markRatePromptAccepted();

  if (chrome?.tabs?.create) {
    chrome.tabs.create({ url: RATE_URL });
    return;
  }

  if (typeof window !== 'undefined') {
    window.open(RATE_URL, '_blank', 'noopener,noreferrer');
  }
}

async function onRateDismiss() {
  showRatePrompt.value = false;
  await markRatePromptDismissed();
}

async function onRateLater() {
  showRatePrompt.value = false;
  await markRatePromptDismissed();
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
  snippetTitle.value = file.name || t('snippet.untitled');
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
  if (!snippetID.value) {
    await restoreLastOpenedSnippet();
  }
  await maybeShowRatePrompt();
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
    <RatePromptModal
      :visible="showRatePrompt"
      @accept="onRateAccept"
      @dismiss="onRateDismiss"
      @later="onRateLater"
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
