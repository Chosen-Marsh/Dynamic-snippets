<template>
  <section class="changelog" :aria-label="historyMode ? $t('changelog.versionHistory') : $t('changelog.whatsNew')">
    <header class="changelog-header">
      <p class="eyebrow">{{ historyMode ? $t('changelog.releaseNotes') : $t('changelog.whatsNew') }}</p>
      <h1>{{ historyMode ? $t('changelog.versionHistory') : (changelog?.title || $t('changelog.latestUpdates')) }}</h1>
      <p v-if="!historyMode && changelog" class="header-meta">
        <span class="version-tag">v{{ changelog.version }}</span>
        <span v-if="changelog.date">{{ formatDate(changelog.date) }}</span>
      </p>
    </header>

    <ol class="releases" :class="{ 'releases--single': !historyMode }">
      <li
        v-for="(entry, index) in entries"
        :key="entry.version"
        class="release"
        :class="{ 'release--open': isOpen(entry.version), 'release--latest': index === 0 }"
      >
        <span v-if="historyMode" class="release-dot" aria-hidden="true" />

        <button
          v-if="historyMode"
          :id="`release-head-${entry.version}`"
          class="release-head"
          type="button"
          :aria-expanded="isOpen(entry.version)"
          :aria-controls="`release-body-${entry.version}`"
          @click="toggle(entry.version)"
        >
          <span class="release-head-main">
            <span class="release-meta">
              <span class="version-tag">v{{ entry.version }}</span>
              <span v-if="entry.date">{{ formatDate(entry.date) }}</span>
              <span v-if="index === 0" class="latest-tag">{{ $t('changelog.latest') }}</span>
            </span>
            <span class="release-title">{{ entry.title }}</span>
            <span class="release-counts">
              <span
                v-for="count in countByType(entry.changes)"
                :key="count.type"
                class="count"
                :class="`type--${count.type}`"
              >{{ count.count }} {{ $t(`changelog.types.${count.type}`) }}</span>
            </span>
          </span>
          <svg class="chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <div
          v-if="isOpen(entry.version)"
          :id="`release-body-${entry.version}`"
          class="release-body"
          role="region"
          :aria-labelledby="historyMode ? `release-head-${entry.version}` : undefined"
        >
          <ul class="changes">
            <li v-for="(item, i) in normalizeChanges(entry.changes)" :key="i" class="change">
              <span class="badge" :class="`type--${item.type}`">{{ $t(`changelog.types.${item.type}`) }}</span>
              <div class="change-text" v-html="item.text"></div>
            </li>
          </ul>

          <section v-if="index === 0 && normalizeNotes(entry.comingSoon).length" class="coming-soon">
            <h3>{{ $t('changelog.comingSoon') }}</h3>
            <ul>
              <li v-for="(note, i) in normalizeNotes(entry.comingSoon)" :key="i" v-html="note"></li>
            </ul>
          </section>
        </div>
      </li>
    </ol>

    <footer class="changelog-footer">
      <p class="helper">
        {{ historyMode ? $t('changelog.releaseCount', { count: entries.length }) : $t('changelog.onlyOnce') }}
      </p>
      <button class="btn-primary" type="button" @click="emit(historyMode ? 'closeHistory' : 'dismiss')">
        {{ historyMode ? $t('changelog.closeHistory') : $t('changelog.gotIt') }}
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { getLocale } from '../i18n/index.js';

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

const emit = defineEmits(['dismiss', 'closeHistory']);

const TYPES = ['added', 'changed', 'fixed', 'removed'];

const entries = computed(() => {
  if (props.historyMode) return Array.isArray(props.history) ? props.history : [];
  return props.changelog ? [props.changelog] : [];
});

// Versions the user has expanded; the newest release starts open.
const openVersions = ref(new Set());

function resetOpen() {
  const first = entries.value[0]?.version;
  openVersions.value = new Set(first ? [first] : []);
}

watch(() => [props.historyMode, entries.value[0]?.version], resetOpen, { immediate: true });

function isOpen(version) {
  return !props.historyMode || openVersions.value.has(version);
}

function toggle(version) {
  const next = new Set(openVersions.value);
  if (next.has(version)) next.delete(version);
  else next.add(version);
  openVersions.value = next;
}

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  try {
    return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(date);
  } catch {
    return value;
  }
}

function normalizeChanges(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      const raw = typeof item === 'string' ? { text: item } : item || {};
      const type = TYPES.includes(raw.type) ? raw.type : 'changed';
      return { type, text: String(raw.text || ''), index };
    })
    .sort((a, b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || a.index - b.index);
}

function countByType(items = []) {
  const counts = {};
  for (const item of normalizeChanges(items)) counts[item.type] = (counts[item.type] || 0) + 1;
  return TYPES.filter((type) => counts[type]).map((type) => ({ type, count: counts[type] }));
}

function normalizeNotes(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => String(item || '').trim()).filter(Boolean);
}
</script>

<style scoped>
.changelog {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 18px 14px;
  border-left: 1px solid var(--border);
  background: var(--welcome-bg, linear-gradient(180deg, var(--bg-elev) 0%, var(--bg) 100%));
  overflow: hidden;
}

/* Change-type colours: one hue each, mixed with the theme so both themes stay readable. */
.type--added { --type: #22c55e; }
.type--changed { --type: #0ea5e9; }
.type--fixed { --type: #eab308; }
.type--removed { --type: #ef4444; }

/* Header */
.eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
}

.changelog-header h1 {
  margin: 0;
  color: var(--text);
  font-size: 19px;
  line-height: 1.2;
  font-weight: 650;
}

.header-meta,
.release-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--muted);
  font-size: 11px;
}

.header-meta {
  margin: 8px 0 0;
}

.version-tag {
  color: var(--accent);
  font-family: "Cascadia Code", "Consolas", monospace;
  font-weight: 700;
}

.latest-tag {
  padding: 1px 6px;
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  border-radius: 999px;
  background: var(--accent-soft);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Timeline */
.releases {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0 4px 0 18px;
  list-style: none;
  overflow-y: auto;
  position: relative;
}

.releases--single {
  padding-left: 0;
}

.release {
  position: relative;
  padding-bottom: 10px;
}

/* Vertical line linking the releases */
.releases:not(.releases--single) .release::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 14px;
  bottom: -14px;
  width: 1px;
  background: var(--border);
}

.releases:not(.releases--single) .release:last-child::before {
  display: none;
}

.release-dot {
  position: absolute;
  left: -16px;
  top: 10px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--border);
}

.release--latest .release-dot {
  background: var(--accent);
  border-color: var(--accent);
}

.release--open .release-dot {
  border-color: var(--accent);
}

.release-head {
  appearance: none;
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elev-2);
  box-shadow: var(--shadow-sm);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease;
}

.release-head:hover {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
}

.release-head:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.release--open .release-head {
  border-bottom-color: transparent;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.release-head-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.release-title {
  color: var(--text);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.3;
}

.release-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 1px;
}

.count {
  color: color-mix(in srgb, var(--type) 75%, var(--text));
  font-size: 10.5px;
  font-weight: 600;
}

.count::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: 1px;
  background: var(--type);
}

.chevron {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  color: var(--muted);
  transition: transform 160ms ease;
}

.release--open .chevron {
  transform: rotate(180deg);
}

/* Release body */
.release-body {
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: var(--bg-elev);
  padding: 4px 10px 10px;
}

.releases--single .release-body {
  border-top: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding-top: 6px;
}

.changes {
  margin: 0;
  padding: 0;
  list-style: none;
}

.change {
  display: grid;
  grid-template-columns: 62px 1fr;
  gap: 10px;
  align-items: baseline;
  padding: 6px 0;
}

.change + .change {
  border-top: 1px dashed var(--border);
}

.badge {
  justify-self: start;
  padding: 1px 6px;
  color: color-mix(in srgb, var(--type) 70%, var(--text));
  border: 1px solid color-mix(in srgb, var(--type) 40%, transparent);
  background: color-mix(in srgb, var(--type) 14%, transparent);
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.change-text {
  color: var(--text);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.change-text :deep(a),
.coming-soon :deep(a) {
  color: var(--accent);
}

.coming-soon {
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px dashed color-mix(in srgb, #0ea5e9 45%, var(--border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, #0ea5e9 8%, transparent);
}

.coming-soon h3 {
  margin: 0;
  color: color-mix(in srgb, #0ea5e9 70%, var(--text));
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.coming-soon ul {
  margin: 6px 0 0;
  padding-left: 16px;
  color: var(--text);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-line;
}

.coming-soon li + li {
  margin-top: 4px;
}

/* Footer */
.changelog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.helper {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.35;
}

.btn-primary {
  appearance: none;
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 7px 13px;
  color: #ecfdf5;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 120ms ease, filter 160ms ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (max-width: 680px) {
  .changelog {
    padding: 14px;
    gap: 12px;
  }

  .changelog-header h1 {
    font-size: 17px;
  }
}
</style>
