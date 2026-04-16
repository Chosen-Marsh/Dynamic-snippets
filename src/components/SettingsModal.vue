<template>
  <teleport to="body">
    <div v-if="visible" class="settings-overlay" @mousedown.self="close">
      <section class="settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <header class="settings-header">
          <h3>Settings</h3>
          <button class="settings-close" type="button" @click="close" aria-label="Close">x</button>
        </header>

        <div class="settings-body">
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

        <footer class="settings-footer">
          <button class="btn btn-ghost" type="button" @click="close">Cancel</button>
          <button class="btn btn-primary" type="button" @click="handleSave">Save</button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import settings, { DEFAULTS } from '../services/Settings.js';

const props = defineProps({
  visible: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'saved']);

const form = ref({ ...DEFAULTS });

watch(() => props.visible, async (isVisible) => {
  if (!isVisible) return;
  const current = await settings.get();
  form.value = { ...current };
});

async function handleSave() {
  const saved = await settings.save(form.value);
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
  width: min(420px, 100%);
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

.settings-body {
  padding: 14px;
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

.settings-footer {
  border-top: 1px solid var(--border);
  padding: 12px 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
