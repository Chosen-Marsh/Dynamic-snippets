<template>
  <section class="changelog" :aria-label="historyMode ? 'Version history' : `What's new`">
    <div class="ambient ambient-a" />
    <div class="ambient ambient-b" />

    <header class="changelog-header">
      <p class="eyebrow">{{ historyMode ? 'Release Notes' : `What's New` }}</p>
      <h1>
        {{ historyMode
          ? (selectedHistoryEntry ? selectedHistoryEntry.title : 'Version history')
          : (changelog?.title || 'Latest updates') }}
      </h1>

      <div v-if="historyMode && selectedHistoryEntry" class="meta-row">
        <span class="meta-chip meta-chip--strong">Version {{ selectedHistoryEntry.version }}</span>
        <span class="meta-chip">{{ selectedHistoryEntry.date }}</span>
      </div>

      <div v-else-if="!historyMode" class="meta-row">
        <span class="meta-chip meta-chip--strong">Version {{ changelog?.version }}</span>
        <span class="meta-chip">{{ changelog?.date }}</span>
      </div>
    </header>

    <div v-if="historyMode && !selectedHistoryEntry" class="release-card-grid">
      <button
        v-for="entry in historyEntries"
        :key="entry.version"
        class="release-card"
        type="button"
        @click="openHistoryEntry(entry.version)"
      >
        <h2 class="release-card-title">{{ entry.title }}</h2>
        <div class="release-card-meta">
          <span class="meta-chip meta-chip--strong">Version {{ entry.version }}</span>
          <span class="meta-chip">{{ entry.date }}</span>
        </div>
        <p class="release-card-cta">Open changelog</p>
      </button>
    </div>

    <div v-else-if="historyMode && selectedHistoryEntry" class="history-detail-wrap">
      <div class="history-detail-actions">
        <button class="btn btn-ghost" type="button" @click="closeHistoryEntry">Close changelog</button>
      </div>

      <ul class="changelog-list">
        <li
          v-for="(item, index) in normalizeChanges(selectedHistoryEntry.changes || [])"
          :key="index"
          class="change-item"
        >
          <span class="change-type" :class="`change-type--${item.type}`">{{ item.type }}</span>
          <span>{{ item.text }}</span>
        </li>
        <li v-if="normalizeNotes(selectedHistoryEntry.comingSoon).length" class="coming-row">
          <section class="coming-soon">
            <h3>Coming soon</h3>
            <ul class="coming-list">
              <li
                v-for="(note, index) in normalizeNotes(selectedHistoryEntry.comingSoon)"
                :key="`history-coming-${index}`"
                class="coming-item"
              >
                {{ note }}
              </li>
            </ul>
          </section>
        </li>
      </ul>
    </div>

    <ul v-else class="changelog-list">
      <li v-for="(item, index) in normalizeChanges(changelog?.changes || [])" :key="index" class="change-item">
        <span class="change-type" :class="`change-type--${item.type}`">{{ item.type }}</span>
        <span>{{ item.text }}</span>
      </li>
      <li v-if="normalizeNotes(changelog?.comingSoon).length" class="coming-row">
        <section class="coming-soon">
          <h3>Coming soon</h3>
          <ul class="coming-list">
            <li v-for="(note, index) in normalizeNotes(changelog?.comingSoon)" :key="`coming-${index}`" class="coming-item">
              {{ note }}
            </li>
          </ul>
        </section>
      </li>
    </ul>

    <footer class="changelog-footer">
      <p class="helper">
        {{ historyMode
          ? (selectedHistoryEntry ? 'Viewing release details.' : 'Choose a release card to view full changes.')
          : 'You will only see this once per version.' }}
      </p>
      <button class="btn btn-primary" type="button" @click="emit(historyMode ? 'closeHistory' : 'dismiss')">
        {{ historyMode ? 'Close history' : 'Got it' }}
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue';

const props = defineProps({
  changelog: {
    type: Object,
    default: null
  },
  history: {
    type: Array,
    default: () => []
  },
  historyMode: {
    type: Boolean,
    default: false
  }
});

const { changelog, historyMode } = toRefs(props);

const emit = defineEmits(['dismiss', 'closeHistory']);

const selectedHistoryVersion = ref(null);
const historyEntries = computed(() => Array.isArray(props.history) ? props.history : []);
const selectedHistoryEntry = computed(() => {
  if (!selectedHistoryVersion.value) return null;
  return historyEntries.value.find((entry) => entry.version === selectedHistoryVersion.value) || null;
});

function openHistoryEntry(version) {
  selectedHistoryVersion.value = version;
}

function closeHistoryEntry() {
  selectedHistoryVersion.value = null;
}

watch(
  () => props.historyMode,
  (isHistoryMode) => {
    if (!isHistoryMode) {
      selectedHistoryVersion.value = null;
    }
  }
);

function normalizeChanges(items = []) {
  const normalized = items.map((item) => {
    if (typeof item === 'string') {
      return { type: 'changed', text: item };
    }

    const type = ['added', 'changed', 'removed', 'fixed'].includes(item?.type) ? item.type : 'changed';
    return {
      type,
      text: String(item?.text || '')
    };
  });

  const typePriority = {
    added: 0,
    changed: 1,
    fixed: 2,
    removed: 3
  };

  return normalized
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aPriority = typePriority[a.item.type] ?? 99;
      const bPriority = typePriority[b.item.type] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

function normalizeNotes(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}
</script>

<style scoped>
.changelog {
  position: relative;
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 14px;
  padding: 18px;
  border-left: 1px solid var(--border);
  background: var(--welcome-bg, linear-gradient(180deg, var(--bg-elev) 0%, var(--bg) 100%));
  overflow: hidden;
}

.ambient {
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(26px);
  opacity: 0.35;
}

.ambient-a {
  width: 130px;
  height: 130px;
  right: -34px;
  top: -24px;
  background: rgba(34, 197, 94, 0.32);
}

.ambient-b {
  width: 118px;
  height: 118px;
  left: -34px;
  bottom: 24px;
  background: rgba(14, 165, 233, 0.28);
}

.changelog-header,
.release-card-grid,
.history-detail-wrap,
.changelog-list,
.changelog-footer {
  position: relative;
  z-index: 1;
}

.changelog-header h1 {
  margin: 0;
  color: var(--text);
  font-size: 19px;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
}

.meta-row {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-chip {
  color: var(--text);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #395073;
  background: #1a2942;
  border-radius: 999px;
  padding: 4px 9px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.meta-chip--strong {
  color: #d1fae5;
  border-color: rgba(34, 197, 94, 0.45);
  background: rgba(22, 163, 74, 0.28);
}

.release-card-grid {
  margin: 0;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(10, 16, 28, 0.8);
  display: grid;
  gap: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) var(--bg-elev-2);
}

.release-card {
  appearance: none;
  border: 1px solid #324563;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(22, 33, 51, 0.95) 0%, rgba(15, 24, 40, 0.95) 100%);
  padding: 10px;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, transform 120ms ease, box-shadow 160ms ease;
}

.release-card:hover,
.release-card:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.25), 0 8px 16px rgba(0, 0, 0, 0.24);
  transform: translateY(-1px);
}

.release-card-title {
  margin: 0;
  color: #f8fafc;
  font-size: 14px;
  line-height: 1.3;
}

.release-card-meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.release-card-cta {
  margin: 10px 0 0;
  color: #86efac;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.history-detail-wrap {
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
}

.history-detail-actions {
  display: flex;
  justify-content: flex-end;
}

.changelog-list {
  margin: 0;
  list-style: none;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-elev);
  display: grid;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) var(--bg-elev-2);
}

.changelog-list::-webkit-scrollbar,
.release-card-grid::-webkit-scrollbar {
  width: 10px;
}

.changelog-list::-webkit-scrollbar-track,
.release-card-grid::-webkit-scrollbar-track {
  background: var(--bg-elev-2);
  border-radius: 999px;
}

.changelog-list::-webkit-scrollbar-thumb,
.release-card-grid::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 999px;
  border: 2px solid var(--bg-elev-2);
}

.change-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 9px;
  align-items: flex-start;
  border: 1px solid #324563;
  border-radius: 9px;
  background: rgba(22, 34, 52, 0.9);
  color: var(--text);
  font-size: 12px;
  line-height: 1.5;
  padding: 9px;
}

.change-type {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 9px;
  font-weight: 800;
  border-radius: 999px;
  border: 1px solid transparent;
  height: 18px;
  min-width: 58px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.change-type--added {
  color: #bbf7d0;
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.18);
}

.change-type--changed {
  color: #bae6fd;
  border-color: rgba(14, 165, 233, 0.38);
  background: rgba(14, 165, 233, 0.16);
}

.change-type--removed {
  color: #fecaca;
  border-color: rgba(239, 68, 68, 0.38);
  background: rgba(239, 68, 68, 0.18);
}

.change-type--fixed {
  color: #fef08a;
  border-color: rgba(234, 179, 8, 0.4);
  background: rgba(234, 179, 8, 0.2);
}

.coming-row {
  list-style: none;
}

.coming-soon {
  margin-top: 10px;
  border: 1px dashed #3a5378;
  border-radius: 9px;
  background: rgba(15, 37, 62, 0.72);
  padding: 9px;
}

.coming-soon h3 {
  margin: 0;
  color: #bae6fd;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.coming-list {
  list-style: disc;
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--text);
  font-size: 12px;
  line-height: 1.45;
}

.coming-item + .coming-item {
  margin-top: 5px;
}

.changelog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.helper {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.35;
  max-width: 220px;
}

.btn {
  appearance: none;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 8px 13px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 160ms ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-primary {
  color: #ecfdf5;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.24);
}

.btn-ghost {
  color: var(--text);
  background: rgba(20, 30, 46, 0.92);
  border-color: #3b4f6f;
}

[data-theme="light"] .changelog {
  background: linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
}

[data-theme="light"] .release-card-grid,
[data-theme="light"] .changelog-list {
  background: #ffffff;
  border-color: #b8c6d8;
}

[data-theme="light"] .meta-chip {
  background: #ffffff;
  border-color: #b8c6d8;
  color: #0f172a;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

[data-theme="light"] .meta-chip--strong {
  color: #14532d;
  border-color: #86efac;
  background: #dcfce7;
}

[data-theme="light"] .release-card {
  background: #f8fbff;
  border-color: #b8c6d8;
}

[data-theme="light"] .release-card-title {
  color: #0f172a;
}

[data-theme="light"] .release-card-cta {
  color: #166534;
}

[data-theme="light"] .change-item {
  background: #f8fbff;
  border-color: #b8c6d8;
}

[data-theme="light"] .change-type--added {
  color: #14532d;
  border-color: #86efac;
  background: #dcfce7;
}

[data-theme="light"] .change-type--changed {
  color: #0c4a6e;
  border-color: #7dd3fc;
  background: #e0f2fe;
}

[data-theme="light"] .change-type--removed {
  color: #7f1d1d;
  border-color: #fca5a5;
  background: #fee2e2;
}

[data-theme="light"] .change-type--fixed {
  color: #713f12;
  border-color: #fcd34d;
  background: #fef3c7;
}

[data-theme="light"] .coming-soon {
  background: #eef6ff;
  border-color: #9ec5f8;
}

[data-theme="light"] .coming-soon h3 {
  color: #0c4a6e;
}

[data-theme="light"] .btn-ghost {
  color: #0f172a;
  background: #f8fbff;
  border-color: #b8c6d8;
}

@media (max-width: 680px) {
  .changelog {
    padding: 14px;
    gap: 12px;
  }

  .changelog-header h1 {
    font-size: 17px;
  }

  .changelog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .helper {
    max-width: none;
  }

  .btn {
    width: 100%;
  }

  .history-detail-actions {
    justify-content: stretch;
  }
}
</style>
