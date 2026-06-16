<template>
  <teleport to="body">
    <div v-if="visible" class="settings-overlay" @mousedown.self="close">
      <section class="settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <header class="settings-header">
          <h3>Settings</h3>
          <button class="settings-close" type="button" @click="close" aria-label="Close">x</button>
        </header>

        <nav class="settings-tabs" aria-label="Settings sections">
          <button
            type="button"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === 'general' }"
            @click="activeTab = 'general'"
          >
            General
          </button>
          <button
            type="button"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === 'globals' }"
            @click="activeTab = 'globals'"
          >
            Global Variables
          </button>
        </nav>

        <div class="settings-body">
          <div v-if="activeTab === 'general'" class="settings-panel">
            <label class="field">
              <span class="field-label">Theme</span>
              <select v-model="form.theme" class="field-input">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">Auto-save debounce (ms)</span>
              <input
                v-model.number="form.debounceMs"
                class="field-input"
                type="number"
                min="50"
                max="5000"
                step="50"
              />
            </label>
          </div>

          <div v-else class="settings-panel">
            <p class="globals-help">
              Define reusable values for <code v-pre>${key-global}</code> tokens. Missing keys paste as
              <code>undefined</code>.
            </p>

            <div v-if="globalVarRows.length" class="globals-list">
              <div class="globals-row globals-row--header">
                <span>Key</span>
                <span>Value</span>
                <span />
              </div>
              <div v-for="(row, index) in globalVarRows" :key="index" class="globals-row">
                <input
                  v-model="row.key"
                  class="field-input"
                  type="text"
                  placeholder="key"
                  spellcheck="false"
                />
                <input
                  v-model="row.value"
                  class="field-input"
                  type="text"
                  placeholder="value"
                />
                <button
                  type="button"
                  class="globals-remove"
                  title="Remove variable"
                  @click="removeGlobalVarRow(index)"
                >
                  x
                </button>
              </div>
            </div>

            <p v-else class="globals-empty">No global variables yet.</p>

            <button type="button" class="btn btn-add" @click="addGlobalVarRow">Add variable</button>
          </div>
        </div>

        <footer class="settings-footer">
          <button class="btn btn-ghost" type="button" @click="close">Cancel</button>
          <button class="btn btn-primary" type="button" @click="handleSave">Save</button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import settings, { DEFAULTS } from '../services/Settings.js';
import globalVariables from '../services/GlobalVariables.js';

const props = defineProps({
  visible: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'saved']);

const activeTab = ref('general');
const form = ref({ ...DEFAULTS });
const globalVarRows = ref([]);

function addGlobalVarRow() {
  globalVarRows.value.push({ key: '', value: '' });
}

function removeGlobalVarRow(index) {
  globalVarRows.value.splice(index, 1);
}

watch(() => props.visible, async (isVisible) => {
  if (!isVisible) return;
  activeTab.value = 'general';
  const current = await settings.get();
  form.value = { ...current };
  const globals = await globalVariables.getAll();
  globalVarRows.value = Object.entries(globals).map(([key, value]) => ({ key, value }));
});

async function handleSave() {
  const saved = await settings.save(form.value);
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
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.settings-modal {
  width: min(520px, 100%);
  max-height: calc(100dvh - 32px);
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.settings-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.settings-close {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.settings-close:hover {
  background: var(--bg-elev-2);
  color: var(--text);
}

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 14px 0;
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
  padding: 14px;
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
  border: 1px solid var(--border);
  background: var(--bg-elev-2);
  color: var(--text);
  border-radius: 8px;
  padding: 9px 10px;
  outline: none;
  font-size: 12px;
}

.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
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
  color: var(--danger, #f87171);
  border-color: var(--danger, #f87171);
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
  padding: 12px 14px;
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
  color: #ecfdf5;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}

.btn-ghost {
  color: var(--text);
  background: var(--bg-elev-2);
  border-color: var(--border);
}
</style>
