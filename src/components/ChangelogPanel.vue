<template>
  <section class="changelog" :aria-label="historyMode ? 'Version history' : `What's new`">
    <div class="ambient ambient-a" />
    <div class="ambient ambient-b" />

    <header class="changelog-header">
      <p class="eyebrow">{{ historyMode ? 'Release Notes' : `What's New` }}</p>
      <h1>{{ historyMode ? 'Version history' : (changelog?.title || 'Latest updates') }}</h1>
      <div v-if="!historyMode" class="meta-row">
        <span class="meta-chip">Version {{ changelog?.version }}</span>
        <span class="meta-chip">{{ changelog?.date }}</span>
      </div>
    </header>

    <div v-if="historyMode" class="changelog-list history-list">
      <article v-for="entry in historyEntries" :key="entry.version" class="history-card">
        <header class="history-header">
          <h2>{{ entry.title }}</h2>
          <div class="meta-row">
            <span class="meta-chip">Version {{ entry.version }}</span>
            <span class="meta-chip">{{ entry.date }}</span>
          </div>
        </header>
        <ul class="entry-list">
          <li v-for="(item, index) in normalizeChanges(entry.changes)" :key="index" class="change-item">
            <span class="change-type" :class="`change-type--${item.type}`">{{ item.type }}</span>
            <span>{{ item.text }}</span>
          </li>
        </ul>
        <section v-if="normalizeNotes(entry.comingSoon).length" class="coming-soon">
          <h3>Coming soon</h3>
          <ul class="coming-list">
            <li v-for="(note, index) in normalizeNotes(entry.comingSoon)" :key="`history-coming-${index}`" class="coming-item">
              {{ note }}
            </li>
          </ul>
        </section>
      </article>
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
      <p class="helper">{{ historyMode ? 'Review previous releases anytime from Welcome.' : 'You will only see this once per version.' }}</p>
      <button class="btn btn-primary" type="button" @click="emit(historyMode ? 'closeHistory' : 'dismiss')">
        {{ historyMode ? 'Close history' : 'Got it' }}
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue';

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

const historyEntries = computed(() => Array.isArray(props.history) ? props.history : []);

function normalizeChanges(items = []) {
  return items.map((item) => {
    if (typeof item === 'string') {
      return { type: 'changed', text: item };
    }

    const type = ['added', 'changed', 'removed'].includes(item?.type) ? item.type : 'changed';
    return {
      type,
      text: String(item?.text || '')
    };
  });
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
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.56);
  border-radius: 999px;
  padding: 4px 9px;
}

.changelog-list {
  margin: 0;
  list-style: none;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-elev-2);
  display: grid;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) var(--bg-elev-2);
}

.changelog-list::-webkit-scrollbar {
  width: 10px;
}

.changelog-list::-webkit-scrollbar-track {
  background: var(--bg-elev-2);
  border-radius: 999px;
}

.changelog-list::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 999px;
  border: 2px solid var(--bg-elev-2);
}

.change-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 9px;
  align-items: flex-start;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.5);
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
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.16);
}

.change-type--changed {
  color: #bae6fd;
  border-color: rgba(14, 165, 233, 0.35);
  background: rgba(14, 165, 233, 0.14);
}

.change-type--removed {
  color: #fecaca;
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.16);
}

.history-list {
  align-content: start;
}

.history-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.44);
  padding: 10px;
}

.history-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  line-height: 1.25;
}

.entry-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.coming-row {
  list-style: none;
}

.coming-soon {
  margin-top: 10px;
  border: 1px dashed rgba(186, 230, 253, 0.35);
  border-radius: 9px;
  background: rgba(8, 47, 73, 0.25);
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
}
</style>
