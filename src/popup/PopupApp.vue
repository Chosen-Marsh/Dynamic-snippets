<script setup>
import Snippet from '../components/Snippet.vue';
import FolderTreeSideBar from '../components/FolderTreeSideBar.vue';
import Welcome from '../components/Welcome.vue';
import ChangelogPanel from '../components/ChangelogPanel.vue';
import AnalyticsConsentModal from '../components/AnalyticsConsentModal.vue';
import RatePromptModal from '../components/RatePromptModal.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import Onboarding from '../components/Onboarding.vue';
import onboardingState from '../services/OnboardingState.js';
import settings from '../services/Settings.js';
import Snippets from '../services/Snippets.js';
import changelogState from '../services/ChangeLogState.js';
import { APP_VERSION } from '../version.js';
import { getAllChangelogs, getChangelogByVersion } from '../changelogs/index.js';
import { hasConsentBeenSetAnywhere, setConsent } from '../services/AnalyticsConsent.js';
import { ANALYTICS_ENABLED, track, flushAnalytics } from '../services/Analytics.js';
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
const showSettings = ref(false);
const onboardingPending = ref(false);
const onboardingIsFirstRun = ref(false);
// Consent comes first if it is needed; the tour waits behind it.
const showOnboarding = computed(() => onboardingPending.value && !showConsentModal.value);

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
  if (showConsentModal.value || onboardingPending.value || showChangelog.value || showRatePrompt.value) return;
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
  const [seenVersion, onboardingDone] = await Promise.all([
    changelogState.getSeenVersion(),
    onboardingState.isCompleted()
  ]);

  // No changelog has ever been dismissed, so this is a brand-new user: show the tour, not release notes.
  if (!onboardingDone && seenVersion === null) {
    onboardingPending.value = true;
    onboardingIsFirstRun.value = true;
  } else if (availableChangelog) {
    currentChangelog.value = availableChangelog;
    showChangelog.value = seenVersion !== APP_VERSION;
  }

  if (showChangelog.value) {
    isRestoringSnippet.value = false;
  } else {
    await restoreLastOpenedSnippet();
  }

  await maybeShowRatePrompt();

  if (!showConsentModal.value) {
    // Await the enqueue so this open is included in the upload below.
    await track('popup_opened');
  }
  flushAnalytics();
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

async function onOnboardingSettings(partial) {
  const saved = await settings.save(partial);
  currentSettings.value = saved;
  applyTheme(saved.theme);
  applyLanguage(saved.language);
}

async function onOnboardingFinish({ action, step }) {
  onboardingPending.value = false;
  await onboardingState.markCompleted();
  if (onboardingIsFirstRun.value) {
    onboardingIsFirstRun.value = false;
    await changelogState.setSeenVersion(APP_VERSION);
  }
  track('onboarding_finished', { action, step });
  if (action === 'create') {
    await onWelcomeCreateSnippet();
  }
  await maybeShowRatePrompt();
}

function replayOnboarding() {
  showSettings.value = false;
  onboardingPending.value = true;
  track('onboarding_replayed');
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
  if (showSettings.value) track('settings_opened');
}

function closeSettings() {
  showSettings.value = false;
}

async function onImportCompleted() {
  await sidebarRef.value?.loadFolders();
  track('snippets_imported');
}

function onSettingsSaved(s) {
  currentSettings.value = s;
  applyTheme(s.theme);
  applyLanguage(s.language);
  track('settings_saved');
}

function onAnalyticsEvent(action, props) {
  track(action, props);
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
  showSettings.value = false;
  snippetID.value = file.id;
  snippetTitle.value = file.name || t('snippet.untitled');
  track('snippet_opened');
  Snippets.setLastOpenedSnippetId(file.id).catch(err => {
    console.error('Failed to set last opened snippet ID:', err);
  });
}

async function onWelcomeCreateSnippet() {
  try {
    const snippet = await Snippets.createSnippet({ name: t('sidebar.defaultSnippetName'), content: '' });
    await sidebarRef.value?.loadFolders();
    onFileSelect(snippet);
    track('snippet_created', { source: 'welcome' });
  } catch (err) {
    console.error('Failed to create snippet from welcome page:', err);
  }
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
    <Onboarding
      :visible="showOnboarding"
      :settings="currentSettings"
      @update-settings="onOnboardingSettings"
      @finish="onOnboardingFinish"
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
      :settings-open="showSettings"
      @select="onFileSelect"
      @delete="onSnippetDelete"
      @toggle-settings="toggleSettings"
      @snippet-created="() => onAnalyticsEvent('snippet_created', { source: 'sidebar' })"
      @folder-created="() => onAnalyticsEvent('folder_created')"
    />
    <SettingsPanel
      v-if="showSettings"
      @close="closeSettings"
      @saved="onSettingsSaved"
      @import-completed="onImportCompleted"
      @export-completed="() => onAnalyticsEvent('snippets_exported')"
    />
    <ChangelogPanel
      v-else-if="!snippetID && !isRestoringSnippet && (showChangelog || showVersionHistory)"
      :changelog="currentChangelog"
      :history="allChangelogs"
      :history-mode="showVersionHistory && !showChangelog"
      @dismiss="dismissChangelog"
      @close-history="closeVersionHistory"
    />
    <Welcome
      v-else-if="!snippetID && !isRestoringSnippet"
      @create-snippet="onWelcomeCreateSnippet"
      @start-tour="replayOnboarding"
      @view-history="openVersionHistory"
    />
    <Snippet
      v-if="snippetID"
      v-show="!showSettings"
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
