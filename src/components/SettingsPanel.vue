<template>
  <section class="settings" :aria-label="$t('settings.title')">
        <header class="settings-header">
          <div>
            <p class="eyebrow">{{ $t('app.name') }}</p>
            <h1>{{ $t('settings.title') }}</h1>
          </div>
          <button class="settings-close" type="button" @click="close" :aria-label="$t('common.close')" :title="$t('common.close')">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <nav class="settings-tabs" :aria-label="$t('settings.sections')">
          <button
            type="button"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === 'general' }"
            @click="activeTab = 'general'"
          >
            {{ $t('settings.tabs.general') }}
          </button>
          <button
            type="button"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === 'data' }"
            @click="activeTab = 'data'"
          >
            {{ $t('settings.tabs.data') }}
          </button>
          <button
            type="button"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === 'globals' }"
            @click="activeTab = 'globals'"
          >
            {{ $t('settings.tabs.globals') }}
          </button>
        </nav>

        <div class="settings-body">
          <div v-if="activeTab === 'general'" class="settings-panel">
            <label class="field">
              <span class="field-label">{{ $t('settings.general.theme') }}</span>
              <select v-model="form.theme" class="field-input">
                <option value="dark">{{ $t('settings.general.themeDark') }}</option>
                <option value="light">{{ $t('settings.general.themeLight') }}</option>
              </select>
            </label>

            <label v-if="availableLocales.length > 1" class="field">
              <span class="field-label">{{ $t('settings.general.language') }}</span>
              <select v-model="form.language" class="field-input">
                <option v-for="loc in availableLocales" :key="loc.code" :value="loc.code">{{ loc.name }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ $t('settings.general.debounce') }}</span>
              <input
                v-model.number="form.debounceMs"
                class="field-input"
                type="number"
                min="50"
                max="5000"
                step="50"
              />
            </label>

            <div class="toggle-field">
              <div class="toggle-copy">
                <span class="field-label">{{ $t('settings.general.analytics') }}</span>
                <p class="toggle-help">
                  {{ $t('settings.general.analyticsHelp') }}
                </p>
              </div>
              <button
                type="button"
                class="toggle"
                :class="{ 'toggle--on': analyticsEnabled }"
                role="switch"
                :aria-checked="analyticsEnabled"
                @click="analyticsEnabled = !analyticsEnabled"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
          </div>

          <div v-else-if="activeTab === 'data'" class="settings-panel">
            <div class="data-tools">
              <div class="toggle-copy">
                <span class="field-label">{{ $t('settings.data.title') }}</span>
                <p class="toggle-help">{{ $t('settings.data.help') }}</p>
              </div>
              <div class="data-tools-actions">
                <button class="btn btn-ghost" type="button" @click="handleImport">{{ $t('settings.data.import') }}</button>
                <button class="btn btn-primary" type="button" @click="handleExport">{{ $t('settings.data.export') }}</button>
              </div>
              <p v-if="importStatus" class="data-tools-status">{{ importStatus }}</p>
            </div>
          </div>

          <div v-else class="settings-panel">
            <p class="globals-help">
              {{ $t('settings.globals.helpBefore') }} <code v-pre>${key-global}</code> {{ $t('settings.globals.helpAfter') }}
              <code>undefined</code>.
            </p>

            <div v-if="globalVarRows.length" class="globals-list">
              <div class="globals-row globals-row--header">
                <span>{{ $t('settings.globals.key') }}</span>
                <span>{{ $t('settings.globals.value') }}</span>
                <span />
              </div>
              <div v-for="(row, index) in globalVarRows" :key="index" class="globals-row">
                <input
                  v-model="row.key"
                  class="field-input"
                  type="text"
                  :placeholder="$t('settings.globals.keyPlaceholder')"
                  spellcheck="false"
                />
                <input
                  v-model="row.value"
                  class="field-input"
                  type="text"
                  :placeholder="$t('settings.globals.valuePlaceholder')"
                />
                <button
                  type="button"
                  class="globals-remove"
                  :title="$t('settings.globals.remove')"
                  @click="removeGlobalVarRow(index)"
                >
                  x
                </button>
              </div>
            </div>

            <p v-else class="globals-empty">{{ $t('settings.globals.empty') }}</p>

          <button type="button" class="btn btn-add" @click="addGlobalVarRow">{{ $t('settings.globals.add') }}</button>
          </div>
        </div>

        <footer class="settings-footer">
          <button class="btn btn-ghost" type="button" @click="close">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" type="button" @click="handleSave">{{ $t('common.save') }}</button>
        </footer>

      <div
        v-if="importDialog.visible"
        class="import-modal-backdrop"
        :class="{ 'import-modal-backdrop--closing': importDialog.closing }"
        @mousedown.self="closeImportDialog"
      >
        <section
          class="import-modal"
          :class="{
            'import-modal--closing': importDialog.closing,
            'import-modal--closing-merge': importDialog.closing && importDialog.closeMode === 'merge',
            'import-modal--closing-overwrite': importDialog.closing && importDialog.closeMode === 'overwrite'
          }"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('settings.import.title')"
        >
          <header class="import-modal-header">
            <h4>{{ $t('settings.import.title') }}</h4>
            <button class="settings-close" type="button" @click="closeImportDialog" :aria-label="$t('common.close')">x</button>
          </header>

          <div class="import-modal-body">
            <p class="import-meta">{{ $t('settings.import.schema', { version: importDialog.preview?.schemaVersion || $t('settings.import.unknown') }) }}</p>
            <div class="import-counts">
              <p><strong>{{ $t('settings.import.totalSnippets') }}</strong> {{ importDialog.preview?.counts?.totalSnippets ?? 0 }}</p>
              <p><strong>{{ $t('settings.import.folders') }}</strong> {{ importDialog.preview?.counts?.folders ?? 0 }}</p>
              <p><strong>{{ $t('settings.import.globalVariables') }}</strong> {{ importDialog.preview?.counts?.globalVariables ?? 0 }}</p>
              <p><strong>{{ $t('settings.import.settingsFields') }}</strong> {{ importDialog.preview?.counts?.settings ?? 0 }}</p>
            </div>

            <div v-if="importDialog.preview?.mergeCheck" class="import-merge-check">
              <p><strong>{{ $t('settings.import.mergeChecks') }}</strong></p>
              <ul>
                <li>{{ $t('settings.import.idConflicts', { count: importDialog.preview.mergeCheck.idConflicts }) }}</li>
                <li>{{ $t('settings.import.variableConflicts', { count: importDialog.preview.mergeCheck.variableConflicts }) }}</li>
                <li>{{ $t('settings.import.settingsChanges', { count: importDialog.preview.mergeCheck.settingsChanges }) }}</li>
              </ul>
            </div>

            <div v-if="importDialog.preview?.validation?.warnings?.length" class="import-warning-box">
              <p><strong>{{ $t('settings.import.warnings') }}</strong></p>
              <ul>
                <li v-for="(warning, index) in importDialog.preview.validation.warnings" :key="`warning-${index}`">{{ warning }}</li>
              </ul>
            </div>

            <div v-if="importDialog.preview?.validation?.errors?.length" class="import-error-box">
              <p><strong>{{ $t('settings.import.blocked') }}</strong></p>
              <ul>
                <li v-for="(error, index) in importDialog.preview.validation.errors" :key="`error-${index}`">{{ error }}</li>
              </ul>
            </div>
          </div>

          <footer class="import-modal-footer">
            <button class="btn btn-ghost" type="button" @click="closeImportDialog" :disabled="importDialog.busy">{{ $t('common.cancel') }}</button>
            <button
              class="btn btn-warn"
              :class="{ 'btn-action--active': importDialog.busy && importDialog.closeMode === 'overwrite' }"
              type="button"
              @click="runImport('overwrite')"
              :disabled="importDialog.busy || (importDialog.preview?.validation?.errors?.length ?? 0) > 0"
            >
              {{ importDialog.busy && importDialog.closeMode === 'overwrite' ? $t('settings.import.overwriting') : $t('settings.import.overwrite') }}
            </button>
            <button
              class="btn btn-primary"
              :class="{ 'btn-action--active': importDialog.busy && importDialog.closeMode === 'merge' }"
              type="button"
              @click="runImport('merge')"
              :disabled="importDialog.busy || (importDialog.preview?.validation?.errors?.length ?? 0) > 0"
            >
              {{ importDialog.busy && importDialog.closeMode === 'merge' ? $t('settings.import.merging') : $t('settings.import.merge') }}
            </button>
          </footer>
        </section>
      </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import settings, { DEFAULTS } from '../services/Settings.js';
import globalVariables from '../services/GlobalVariables.js';
import { isAnalyticsEnabled, setConsent } from '../services/AnalyticsConsent.js';
import Snippets from '../services/Snippets.js';
import { useImportExport } from '../composables/useImportExport.js';
import { t, getAvailableLocales } from '../i18n/index.js';

const availableLocales = getAvailableLocales();

const snippetManager = Snippets;

const emit = defineEmits(['close', 'saved', 'import-completed', 'export-completed']);

const activeTab = ref('general');
const form = ref({ ...DEFAULTS });
const analyticsEnabled = ref(false);
const globalVarRows = ref([]);
const importStatus = ref('');
const importDialog = ref({
  visible: false,
  rawText: '',
  preview: null,
  busy: false,
  closing: false,
  closeMode: null
});

const { exportData: exportDataRaw, selectImportFile, getImportPreview, importData } = useImportExport(
  snippetManager,
  async () => {
    emit('import-completed');
  }
);

async function handleExport() {
  await exportDataRaw();
  emit('export-completed');
}

function handleImport() {
  openImportDialog();
}

async function openImportDialog() {
  importStatus.value = '';
  const text = await selectImportFile();
  if (!text) return;

  try {
    const preview = await getImportPreview(text);
    importDialog.value = {
      visible: true,
      rawText: text,
      preview,
      busy: false,
      closing: false,
      closeMode: null
    };
  } catch (error) {
    importStatus.value = error?.message || t('settings.import.previewFailed');
  }
}

function closeImportDialog(force = false) {
  if (importDialog.value.busy && !force) return;
  importDialog.value = {
    visible: false,
    rawText: '',
    preview: null,
    busy: false,
    closing: false,
    closeMode: null
  };
}

async function runImport(mode) {
  if (!importDialog.value.rawText) return;
  importDialog.value.closeMode = mode;
  importDialog.value.busy = true;
  importStatus.value = '';

  try {
    await importData(importDialog.value.rawText, mode);
    importDialog.value.busy = false;
    importDialog.value.closing = true;
    importStatus.value = mode === 'merge'
      ? t('settings.import.completeMerged')
      : t('settings.import.completeOverwritten');
    await new Promise((resolve) => setTimeout(resolve, 260));
    closeImportDialog(true);
  } catch (error) {
    importDialog.value.closeMode = null;
    importDialog.value.closing = false;
    importStatus.value = error?.message || t('settings.import.failed');
  } finally {
    importDialog.value.busy = false;
  }
}

function addGlobalVarRow() {
  globalVarRows.value.push({ key: '', value: '' });
}

function removeGlobalVarRow(index) {
  globalVarRows.value.splice(index, 1);
}

function onKeydown(event) {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  if (importDialog.value.visible) {
    closeImportDialog();
    return;
  }
  close();
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  const current = await settings.get();
  form.value = { ...current };
  analyticsEnabled.value = isAnalyticsEnabled();
  const globals = await globalVariables.getAll();
  globalVarRows.value = Object.entries(globals).map(([key, value]) => ({ key, value }));
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});

async function handleSave() {
  const saved = await settings.save(form.value);
  setConsent(analyticsEnabled.value);
  const globalsObj = {};
  for (const row of globalVarRows.value) {
    const k = row.key.trim();
    if (!k) continue;
    globalsObj[k] = row.value;
  }
  await globalVariables.saveAll(globalsObj);
  emit('saved', saved);
  emit('close');
}

function close() {
  emit('close');
}
</script>

<style scoped>
.settings {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid var(--border);
  background: var(--welcome-bg, linear-gradient(180deg, var(--bg-elev) 0%, var(--bg) 100%));
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 18px 12px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
}

.settings-header h1 {
  margin: 0;
  font-size: 19px;
  line-height: 1.2;
  font-weight: 650;
  color: var(--text);
}

.settings-close {
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 6px;
}

.settings-close svg {
  width: 14px;
  height: 14px;
}

.settings-close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.settings-close:hover {
  background: var(--bg-elev-2);
  color: var(--text);
}

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
}

.settings-tab {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 10px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.settings-tab--active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: var(--bg-elev-2);
}

.settings-body {
  flex: 1;
  padding: 14px 18px;
  overflow-y: auto;
  min-height: 0;
}

.settings-panel {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.field-label {
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field-input {
  width: 100%;
  height: 34px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  border-radius: var(--radius-md);
  padding: 0 10px;
  outline: none;
  font-size: 12px;
  box-shadow: var(--shadow-sm);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.field-input:hover {
  border-color: var(--border-strong);
}

.field-input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.toggle-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--bg-elev-2);
}

.toggle-copy {
  min-width: 0;
}

.toggle-help {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.4;
}

.toggle {
  position: relative;
  width: 38px;
  height: 22px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--bg-hover);
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease;
}

.toggle:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.toggle--on {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  transition: transform 180ms cubic-bezier(.2, .8, .2, 1);
}

.toggle--on .toggle-thumb {
  transform: translateX(16px);
}

.data-tools {
  display: grid;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--bg-elev-2);
}

.data-tools-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

.data-tools-status {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.4;
}

.import-modal-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  z-index: 4;
  padding: 12px;
}

.import-modal-backdrop--closing {
  animation: importBackdropOut 240ms ease forwards;
  pointer-events: none;
}

.import-modal {
  width: min(440px, 100%);
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.import-modal--closing {
  animation: importModalOut 260ms cubic-bezier(0.3, 0.75, 0.35, 1) forwards;
}

.import-modal--closing-merge {
  box-shadow: 0 0 0 2px var(--accent-soft), var(--shadow);
}

.import-modal--closing-overwrite {
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35), var(--shadow);
}

.import-modal-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.import-modal-header h4 {
  margin: 0;
  font-size: 13px;
  color: var(--text);
}

.import-modal-body {
  padding: 12px;
  display: grid;
  gap: 10px;
}

.import-meta {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.import-counts,
.import-merge-check,
.import-warning-box,
.import-error-box {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-elev-2);
  padding: 10px;
}

.import-counts p,
.import-merge-check p,
.import-warning-box p,
.import-error-box p {
  margin: 0;
  color: var(--text);
  font-size: 12px;
}

.import-counts p + p {
  margin-top: 5px;
}

.import-merge-check ul,
.import-warning-box ul,
.import-error-box ul {
  margin: 7px 0 0;
  padding-left: 18px;
  color: var(--muted);
  font-size: 12px;
}

.import-warning-box {
  border-color: var(--warning);
  background: var(--warning-soft);
}

.import-error-box {
  border-color: var(--danger);
  background: var(--danger-soft);
}

.import-modal-footer {
  border-top: 1px solid var(--border);
  padding: 10px 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-warn {
  color: #fff7ed;
  border-color: #ea580c;
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.btn-action--active {
  animation: actionPulse 520ms ease infinite;
}

@keyframes importModalOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(12px) scale(0.975);
  }
}

@keyframes importBackdropOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes actionPulse {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-1px) scale(1.02);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

.globals-help {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

.globals-help code {
  color: var(--text);
  font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
  font-size: 11px;
}

.globals-list {
  display: grid;
  gap: 6px;
}

.globals-row {
  display: grid;
  grid-template-columns: 1fr 1fr 28px;
  gap: 6px;
  align-items: center;
}

.globals-row--header span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.globals-remove {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-elev-2);
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
}

.globals-remove:hover {
  color: var(--danger);
  border-color: var(--danger);
}

.globals-empty {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.btn-add {
  justify-self: start;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--accent);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-add:hover {
  background: var(--bg-elev-2);
}

.settings-footer {
  border-top: 1px solid var(--border);
  padding: 10px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  appearance: none;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 160ms ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  color: var(--accent-contrast);
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 28%, transparent);
}

.btn-ghost {
  color: var(--text);
  background: var(--bg-elev-2);
  border-color: var(--border);
}
</style>
