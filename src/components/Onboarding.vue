<template>
  <teleport to="body">
    <Transition name="ob-fade" appear>
      <div
        v-if="visible"
        ref="dialogRef"
        class="ob"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('onboarding.ariaLabel')"
      >
        <div class="ob-glow ob-glow--a" aria-hidden="true" />
        <div class="ob-glow ob-glow--b" aria-hidden="true" />

        <header class="ob-top">
          <div class="ob-brand">
            <span class="ob-logo" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none"><path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8l1-5.5z" fill="currentColor" /></svg>
            </span>
            {{ $t('app.name') }}
          </div>
          <button v-if="!isLast" class="ob-skip" type="button" @click="finish('skip')">
            {{ $t('onboarding.skip') }}
          </button>
        </header>

        <div class="ob-stage">
          <Transition :name="direction === 1 ? 'ob-next' : 'ob-prev'" mode="out-in">
            <div :key="step.id" class="ob-step" :class="`ob-step--${step.id}`">
              <div class="ob-copy">
                <p class="ob-eyebrow">{{ $t('onboarding.stepOf', { current: index + 1, total: STEPS.length }) }}</p>
                <h1 ref="titleRef" class="ob-title" tabindex="-1">{{ $t(`onboarding.${step.id}.title`) }}</h1>
                <p class="ob-lead">{{ $t(`onboarding.${step.id}.lead`, stepParams) }}</p>

                <ul v-if="step.points.length" class="ob-points">
                  <li v-for="(point, i) in step.points" :key="point" :style="{ '--i': i }">
                    <span class="ob-bullet" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none"><path d="M4 8.5l2.5 2.5L12 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                    <span>{{ $t(`onboarding.${step.id}.${point}`, stepParams) }}</span>
                  </li>
                </ul>

                <label v-if="step.id === 'welcome' && locales.length > 1" class="ob-field">
                  <span>{{ $t('settings.general.language') }}</span>
                  <select :value="currentLanguage" @change="emit('update-settings', { language: $event.target.value })">
                    <option v-for="loc in locales" :key="loc.code" :value="loc.code">{{ loc.name }}</option>
                  </select>
                </label>
              </div>

              <!-- Illustrations -->
              <div class="ob-visual">
                <!-- Welcome: a snippet turning into finished text -->
                <div v-if="step.id === 'welcome'" class="vis vis-welcome" aria-hidden="true">
                  <div class="mock card-raw">
                    <div class="mock-label">Customer Follow-up</div>
                    <p class="mono">Hi <span class="chip chip--text">${name-text}</span>,</p>
                    <p class="mono">Status: <span v-pre class="chip chip--dropdown">${{status-dropdown|…}</span></p>
                  </div>
                  <div class="flow-arrow">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </div>
                  <div class="mock card-done">
                    <p>Hi <mark>Alex</mark>,</p>
                    <p>Status: <mark>ready</mark></p>
                    <span class="sparkle" />
                  </div>
                </div>

                <!-- Organize: sidebar tree with a context menu -->
                <div v-else-if="step.id === 'organize'" class="vis vis-organize" aria-hidden="true">
                  <div class="mock tree">
                    <div class="tree-head">{{ $t('sidebar.title') }}</div>
                    <div class="tree-row tree-row--folder">
                      <span class="tree-caret">▾</span><span class="tree-folder" />Message Templates
                    </div>
                    <div class="tree-row tree-row--child">Customer Follow-up</div>
                    <div class="tree-row tree-row--child tree-row--drag">Quick Standup</div>
                    <div class="tree-row tree-row--active">Bug Report Template</div>
                    <div class="tree-row">PR Checklist Comment</div>
                    <div class="ctx">
                      <div class="ctx-item">{{ $t('sidebar.menu.newSnippet') }}</div>
                      <div class="ctx-item">{{ $t('sidebar.menu.newFolder') }}</div>
                      <div class="ctx-sep" />
                      <div class="ctx-item">{{ $t('sidebar.menu.rename') }}</div>
                      <div class="ctx-item ctx-item--danger">{{ $t('sidebar.menu.delete') }}</div>
                    </div>
                    <svg class="cursor" viewBox="0 0 16 16"><path d="M3 1.5v11l3-2.8 2 4.6 1.8-.8-2-4.5H12L3 1.5z" fill="var(--text)" stroke="var(--bg)" stroke-width="1" /></svg>
                  </div>
                  <div class="saved-pill"><span class="saved-dot" />{{ $t('onboarding.organize.saved') }}</div>
                </div>

                <!-- Variables: token -> form -> preview -->
                <div v-else-if="step.id === 'variables'" class="vis vis-variables" aria-hidden="true">
                  <div class="mock editor">
                    <p class="mono">Env: <span v-pre class="chip chip--dropdown">${{env-dropdown|dev,prod}</span></p>
                    <p class="mono">Ticket: <span class="chip chip--text">${ticket-text|ABC-1}</span></p>
                    <p class="mono">Due: <span class="chip chip--date">${due-date}</span></p>
                  </div>
                  <div class="mock form">
                    <div class="form-title">{{ $t('content.fillVariablesTitle') }}</div>
                    <div class="form-row"><span>env</span><span class="form-input form-input--select">prod<i>▾</i></span></div>
                    <div class="form-row"><span>ticket</span><span class="form-input"><span class="typed">ABC-142</span></span></div>
                    <div class="form-row"><span>due</span><span class="form-input form-input--date">{{ sampleDate }}<i>▦</i></span></div>
                    <div class="form-btn">{{ $t('content.insert') }}</div>
                  </div>
                </div>

                <!-- Globals: stored values flowing into a snippet -->
                <div v-else-if="step.id === 'globals'" class="vis vis-globals" aria-hidden="true">
                  <div class="mock kv">
                    <div class="kv-head"><span>{{ $t('settings.globals.key') }}</span><span>{{ $t('settings.globals.value') }}</span></div>
                    <div class="kv-row"><span class="mono">name</span><span>Alex Rivera</span></div>
                    <div class="kv-row"><span class="mono">team</span><span>Support</span></div>
                  </div>
                  <div class="mock editor editor--small">
                    <p class="mono">Thanks,</p>
                    <p class="mono"><span class="chip chip--global">${name-global}</span></p>
                    <p class="mono"><span class="chip chip--global">${team-global}</span> team</p>
                  </div>
                  <div class="mock card-done card-done--small">
                    <p>Thanks,</p>
                    <p><mark>Alex Rivera</mark></p>
                    <p><mark>Support</mark> team</p>
                  </div>
                </div>

                <!-- Context menu on a web page -->
                <div v-else-if="step.id === 'contextMenu'" class="vis vis-ctxmenu" aria-hidden="true">
                  <div class="mock browser">
                    <div class="browser-bar"><i /><i /><i /><span class="browser-url" /></div>
                    <div class="browser-body">
                      <span class="line line--w60" />
                      <span class="line line--w40" />
                      <div class="textbox"><span class="caret" /></div>
                    </div>
                    <div class="page-menu">
                      <span class="menu-ghost" /><span class="menu-ghost" /><div class="ctx-sep" />
                      <div class="page-menu-item page-menu-item--hot">
                        <span class="ob-logo ob-logo--tiny"><svg viewBox="0 0 16 16"><path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8l1-5.5z" fill="currentColor" /></svg></span>
                        {{ $t('background.insertSnippetMenu') }}<i>▸</i>
                      </div>
                    </div>
                    <div class="page-submenu">
                      <div class="page-menu-item">Message Templates<i>▸</i></div>
                      <div class="page-menu-item page-menu-item--pick">Bug Report Template</div>
                      <div class="page-menu-item">PR Checklist Comment</div>
                    </div>
                  </div>
                </div>

                <!-- Slash command -->
                <div v-else-if="step.id === 'slash'" class="vis vis-slash" aria-hidden="true">
                  <div class="mock cmd-field">
                    <span class="cmd-slash">/</span><span class="mono">bug</span>
                    <span class="cmd-caption">Bug Report Template</span>
                  </div>
                  <div class="mock browser browser--slash">
                    <div class="browser-bar"><i /><i /><i /><span class="browser-url" /></div>
                    <div class="browser-body">
                      <div class="textbox textbox--typing">
                        <span>Found an issue </span><span class="mono typing">/bu</span><span class="caret" />
                      </div>
                      <div class="slash-menu">
                        <div class="slash-item slash-item--hot"><span class="mono">/bug</span>Bug Report Template<kbd>↵</kbd></div>
                        <div class="slash-item"><span class="mono">/build</span>Build Notes</div>
                      </div>
                    </div>
                  </div>
                  <div class="keys"><kbd>↑</kbd><kbd>↓</kbd><kbd>↵</kbd><kbd>Esc</kbd></div>
                </div>

                <!-- Personalize: live theme picker -->
                <div v-else-if="step.id === 'personalize'" class="vis vis-theme" role="radiogroup" :aria-label="$t('settings.general.theme')">
                  <button
                    v-for="theme in ['dark', 'light']"
                    :key="theme"
                    type="button"
                    role="radio"
                    class="theme-card"
                    :class="[`theme-card--${theme}`, { 'theme-card--on': currentTheme === theme }]"
                    :aria-checked="currentTheme === theme"
                    @click="emit('update-settings', { theme })"
                  >
                    <span class="theme-preview">
                      <span class="tp-side"><i /><i /><i /></span>
                      <span class="tp-main"><i /><i /><i class="tp-accent" /></span>
                    </span>
                    <span class="theme-name">
                      <span class="theme-radio" />
                      {{ $t(theme === 'dark' ? 'settings.general.themeDark' : 'settings.general.themeLight') }}
                    </span>
                  </button>
                </div>

                <!-- Ready -->
                <div v-else-if="step.id === 'ready'" class="vis vis-ready" aria-hidden="true">
                  <span class="ring ring--1" /><span class="ring ring--2" />
                  <span v-for="n in 8" :key="n" class="spark" :style="{ '--n': n }" />
                  <div class="ready-badge">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M6 12.5l4 4L18 8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <footer class="ob-nav">
          <div class="ob-progress">
            <button
              v-for="(s, i) in STEPS"
              :key="s.id"
              type="button"
              class="ob-dot"
              :class="{ 'ob-dot--on': i === index, 'ob-dot--done': i < index }"
              :aria-label="$t('onboarding.goToStep', { step: i + 1 })"
              :aria-current="i === index ? 'step' : undefined"
              @click="goTo(i)"
            />
          </div>

          <div class="ob-actions">
            <button v-if="index > 0" class="ob-btn ob-btn--ghost" type="button" @click="goTo(index - 1)">
              {{ $t('onboarding.back') }}
            </button>
            <template v-if="isLast">
              <button class="ob-btn ob-btn--ghost" type="button" @click="finish('explore')">
                {{ $t('onboarding.ready.explore') }}
              </button>
              <button ref="primaryRef" class="ob-btn ob-btn--primary" type="button" @click="finish('create')">
                {{ $t('onboarding.ready.create') }}
              </button>
            </template>
            <button v-else ref="primaryRef" class="ob-btn ob-btn--primary" type="button" @click="goTo(index + 1)">
              {{ index === 0 ? $t('onboarding.start') : $t('onboarding.next') }}
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { t, getLocale, getAvailableLocales } from '../i18n/index.js';

const props = defineProps({
  visible: { type: Boolean, default: false },
  settings: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['finish', 'update-settings']);

const STEPS = [
  { id: 'welcome', points: ['p1', 'p2'] },
  { id: 'organize', points: ['p1', 'p2', 'p3', 'p4'] },
  { id: 'variables', points: ['p1', 'p2', 'p3', 'p4'] },
  { id: 'globals', points: ['p1', 'p2', 'p3'] },
  { id: 'contextMenu', points: ['p1', 'p2'] },
  { id: 'slash', points: ['p1', 'p2', 'p3'] },
  { id: 'personalize', points: ['p1', 'p2', 'p3'] },
  { id: 'ready', points: ['p1'] }
];

const index = ref(0);
const direction = ref(1);
const titleRef = ref(null);
const primaryRef = ref(null);
const dialogRef = ref(null);

const step = computed(() => STEPS[index.value]);
const isLast = computed(() => index.value === STEPS.length - 1);
const locales = getAvailableLocales();
const currentLanguage = computed(() => props.settings?.language || getLocale());
const currentTheme = computed(() => props.settings?.theme || 'dark');

// Real UI labels, so the tour always names things exactly as the user will see them.
const stepParams = computed(() => ({
  menu: t('background.insertSnippetMenu'),
  addVariable: t('snippet.addVariable'),
  addGlobalVariable: t('snippet.addGlobalVariable'),
  globalsTab: t('settings.tabs.globals'),
  importLabel: t('settings.data.import'),
  exportLabel: t('settings.data.export')
}));

const sampleDate = computed(() => {
  try {
    return new Intl.DateTimeFormat(getLocale(), { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return '';
  }
});

function goTo(next) {
  if (next < 0 || next >= STEPS.length || next === index.value) return;
  direction.value = next > index.value ? 1 : -1;
  index.value = next;
}

function finish(action) {
  emit('finish', { action, step: step.value.id });
}

function onKeydown(event) {
  const tag = event.target?.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    goTo(index.value + 1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    goTo(index.value - 1);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    finish('skip');
  }
}

watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible) {
      index.value = 0;
      direction.value = 1;
      window.addEventListener('keydown', onKeydown);
      await nextTick();
      // Focus the dialog itself so keyboard users start inside it without a ring on the first button.
      dialogRef.value?.focus({ preventScroll: true });
    } else {
      window.removeEventListener('keydown', onKeydown);
    }
  },
  { immediate: true }
);

// Move focus to the new heading so screen readers announce each step.
watch(index, async () => {
  await nextTick();
  setTimeout(() => titleRef.value?.focus({ preventScroll: true }), 260);
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
/* ── Shell ─────────────────────────────────────────── */
.ob {
  --ob-sky: #0ea5e9;
  --ob-amber: #f59e0b;
  --ob-violet: #a855f7;
  --ob-radius: 12px;

  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text);
  background: var(--bg);
  font-family: "Segoe UI", "Inter", system-ui, -apple-system, sans-serif;
  outline: none;
}

.ob-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
}

.ob-glow--a {
  width: 320px;
  height: 320px;
  right: -80px;
  top: -120px;
  background: color-mix(in srgb, var(--accent) 45%, transparent);
  animation: drift 14s ease-in-out infinite alternate;
}

.ob-glow--b {
  width: 280px;
  height: 280px;
  left: -120px;
  bottom: -140px;
  background: color-mix(in srgb, var(--ob-sky) 35%, transparent);
  animation: drift 18s ease-in-out infinite alternate-reverse;
}

[data-theme="light"] .ob-glow {
  opacity: 0.28;
}

.ob-top,
.ob-stage,
.ob-nav {
  position: relative;
  z-index: 1;
}

.ob-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px 0;
}

.ob-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ob-logo {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--ob-sky));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent);
}

.ob-logo svg {
  width: 13px;
  height: 13px;
}

.ob-logo--tiny {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  box-shadow: none;
}

.ob-logo--tiny svg {
  width: 9px;
  height: 9px;
}

.ob-skip {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.ob-skip:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

/* ── Step layout ───────────────────────────────────── */
.ob-stage {
  flex: 1;
  min-height: 0;
  display: flex;
}

.ob-step {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  padding: 8px 22px 0;
}

.ob-copy {
  max-height: 100%;
  overflow-y: auto;
  padding: 6px 2px;
  scrollbar-width: none;
}

.ob-eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.ob-title {
  margin: 0;
  font-size: 21px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.01em;
  outline: none;
  background: linear-gradient(120deg, var(--text) 40%, color-mix(in srgb, var(--accent) 70%, var(--text)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ob-lead {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.55;
}

.ob-points {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.ob-points li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text);
  animation: rise 360ms cubic-bezier(.2, .8, .2, 1) both;
  animation-delay: calc(120ms + var(--i) * 60ms);
}

.ob-bullet {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  border-radius: 50%;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}

.ob-bullet svg {
  width: 11px;
  height: 11px;
}

.ob-field {
  display: grid;
  gap: 6px;
  margin-top: 16px;
  max-width: 220px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.ob-field select {
  appearance: auto;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.ob-field select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

/* ── Footer nav ────────────────────────────────────── */
.ob-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 22px 16px;
}

.ob-progress {
  display: flex;
  gap: 6px;
}

.ob-dot {
  appearance: none;
  width: 7px;
  height: 7px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 20%, transparent);
  cursor: pointer;
  transition: width 260ms cubic-bezier(.2, .8, .2, 1), background 200ms ease;
}

.ob-dot--done {
  background: color-mix(in srgb, var(--accent) 55%, transparent);
}

.ob-dot--on {
  width: 22px;
  background: var(--accent);
}

.ob-dot:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.ob-actions {
  display: flex;
  gap: 8px;
}

.ob-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 200ms ease, background 160ms ease;
}

.ob-btn svg {
  width: 13px;
  height: 13px;
  transition: transform 160ms ease;
}

.ob-btn--primary {
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: 0 6px 18px color-mix(in srgb, var(--accent) 35%, transparent);
}

.ob-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--accent) 45%, transparent);
}

.ob-btn--primary:hover svg {
  transform: translateX(2px);
}

.ob-btn--ghost {
  color: var(--text);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border-color: var(--border);
}

.ob-btn--ghost:hover {
  background: color-mix(in srgb, var(--text) 11%, transparent);
}

.ob-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ── Shared mock pieces ────────────────────────────── */
.ob-visual {
  position: relative;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
}

.vis {
  position: relative;
  width: 100%;
  max-width: 262px;
}

.mock {
  position: relative;
  border-radius: var(--ob-radius);
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-elev) 92%, transparent);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28), inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent);
  backdrop-filter: blur(6px);
}

[data-theme="light"] .mock {
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
}

.mock p {
  margin: 0;
}

.mono {
  font-family: "Cascadia Code", "Consolas", monospace;
  font-size: 10.5px;
}

.mock-label {
  margin-bottom: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
}

.chip {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 5px;
  font-family: "Cascadia Code", "Consolas", monospace;
  font-size: 10px;
  color: color-mix(in srgb, var(--c) 75%, var(--text));
  background: color-mix(in srgb, var(--c) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
}

.chip--text { --c: var(--accent); }
.chip--dropdown { --c: var(--ob-sky); }
.chip--date { --c: var(--ob-amber); }
.chip--global { --c: var(--ob-violet); }

mark {
  padding: 0 3px;
  border-radius: 4px;
  color: inherit;
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  animation: highlight 3.2s ease-in-out infinite;
}

.ctx-sep {
  height: 1px;
  margin: 3px 0;
  background: var(--border);
}

kbd {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 5px;
  border: 1px solid var(--border);
  border-bottom-width: 2px;
  background: var(--bg-elev);
  color: var(--muted);
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
}

/* ── Welcome visual ───────────────────────────────── */
.vis-welcome {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.card-raw,
.card-done {
  width: 100%;
  padding: 12px 14px;
  display: grid;
  gap: 4px;
  font-size: 12px;
}

.card-raw {
  transform: rotate(-2deg);
  animation: float 6s ease-in-out infinite;
}

.card-done {
  transform: rotate(1.5deg);
  border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
  animation: float 6s ease-in-out -3s infinite;
}

.card-done--small {
  font-size: 11px;
  padding: 10px 12px;
}

.flow-arrow {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  animation: bob 1.8s ease-in-out infinite;
}

.flow-arrow svg {
  width: 16px;
  height: 16px;
}

.sparkle {
  position: absolute;
  right: 12px;
  top: 10px;
  width: 8px;
  height: 8px;
  background: var(--accent);
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: twinkle 2.4s ease-in-out infinite;
}

/* ── Organize visual ──────────────────────────────── */
.tree {
  padding: 8px 0 10px;
  font-size: 11px;
  overflow: visible;
}

.tree-head {
  padding: 0 12px 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  color: var(--text);
  white-space: nowrap;
}

.tree-row--child {
  padding-left: 32px;
  color: var(--muted);
}

.tree-row--folder {
  font-weight: 600;
}

.tree-caret {
  color: var(--muted);
  font-size: 9px;
}

.tree-folder {
  width: 12px;
  height: 9px;
  border-radius: 2px;
  background: var(--ob-amber);
}

.tree-row--active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  box-shadow: inset 2px 0 0 var(--accent);
  animation: active-row 6s ease-in-out infinite;
}

.tree-row--drag {
  animation: drag-row 6s ease-in-out infinite;
}

.ctx {
  position: absolute;
  right: -14px;
  top: 92px;
  width: 128px;
  padding: 4px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--bg-elev-2);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
  transform-origin: top left;
  animation: ctx-pop 6s ease-in-out infinite;
}

.ctx-item {
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 10.5px;
  color: var(--text);
}

.ctx-item:first-child {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}

.ctx-item--danger {
  color: var(--danger);
}

.cursor {
  position: absolute;
  width: 15px;
  height: 15px;
  left: 60%;
  top: 60%;
  animation: cursor-move 6s ease-in-out infinite;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
}

.saved-pill {
  position: absolute;
  left: 12px;
  bottom: -14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.saved-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1.6s ease-in-out infinite;
}

/* ── Variables visual ─────────────────────────────── */
.vis-variables {
  display: grid;
  gap: 10px;
}

.editor {
  padding: 10px 12px;
  display: grid;
  gap: 5px;
}

.editor--small {
  padding: 9px 12px;
}

.form {
  margin-left: 22px;
  padding: 10px 12px;
  display: grid;
  gap: 6px;
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
  animation: form-in 5s ease-in-out infinite;
}

.form-title {
  font-size: 10.5px;
  font-weight: 700;
  margin-bottom: 2px;
}

.form-row {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--muted);
}

.form-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 10.5px;
  overflow: hidden;
}

.form-input i {
  font-style: normal;
  color: var(--muted);
}

.typed {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  border-right: 1px solid var(--accent);
  animation: type 5s steps(7) infinite;
}

.form-btn {
  justify-self: end;
  padding: 3px 10px;
  border-radius: 6px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
}

/* ── Globals visual ───────────────────────────────── */
.vis-globals {
  display: grid;
  gap: 8px;
}

.kv {
  padding: 8px 0;
  font-size: 11px;
}

.kv-head,
.kv-row {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 8px;
  padding: 3px 12px;
}

.kv-head {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.kv-row .mono {
  color: var(--ob-violet);
}

.vis-globals .editor {
  margin-left: 20px;
}

.vis-globals .card-done {
  margin-left: 40px;
  width: auto;
  transform: none;
}

/* ── Browser mock ─────────────────────────────────── */
.browser {
  overflow: visible;
}

.browser-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 9px;
  border-bottom: 1px solid var(--border);
}

.browser-bar i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--text) 18%, transparent);
}

.browser-url {
  flex: 1;
  height: 10px;
  margin-left: 8px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.browser-body {
  padding: 12px;
  display: grid;
  gap: 7px;
}

.line {
  height: 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--text) 12%, transparent);
}

.line--w60 { width: 60%; }
.line--w40 { width: 40%; }

.textbox {
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 7px 8px;
  border-radius: 7px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--border));
  background: var(--bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
  font-size: 11px;
  align-content: flex-start;
  align-items: flex-start;
}

.textbox--typing {
  min-height: 34px;
}

.caret {
  width: 1px;
  height: 13px;
  background: var(--text);
  animation: blink 1s steps(1) infinite;
}

.page-menu,
.page-submenu {
  position: absolute;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elev-2);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
}

.page-menu {
  left: 40px;
  top: 98px;
  width: 136px;
  animation: ctx-pop 5s ease-in-out infinite;
  transform-origin: top left;
}

.page-submenu {
  left: 172px;
  top: 128px;
  width: 140px;
  animation: sub-pop 5s ease-in-out infinite;
  transform-origin: top left;
}

.menu-ghost {
  display: block;
  height: 6px;
  margin: 6px 8px;
  width: 55%;
  border-radius: 3px;
  background: color-mix(in srgb, var(--text) 14%, transparent);
}

.page-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border-radius: 5px;
  font-size: 10.5px;
  white-space: nowrap;
}

.page-menu-item i {
  margin-left: auto;
  font-style: normal;
  color: var(--muted);
  font-size: 9px;
}

.page-menu-item--hot {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  font-weight: 600;
}

.page-menu-item--pick {
  animation: pick 5s ease-in-out infinite;
}

/* ── Slash visual ─────────────────────────────────── */
.vis-slash {
  display: grid;
  gap: 10px;
}

.cmd-field {
  justify-self: start;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 9px;
  font-size: 11px;
}

.cmd-slash {
  color: var(--accent);
  font-weight: 800;
}

.cmd-caption {
  margin-left: 8px;
  color: var(--muted);
  font-size: 10px;
}

.browser--slash {
  margin-left: 14px;
}

.typing {
  margin-left: 4px;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  color: var(--accent);
  animation: type-slash 4s steps(3) infinite;
}

.slash-menu {
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elev-2);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  animation: slash-pop 4s ease-in-out infinite;
  transform-origin: top left;
}

.slash-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 7px;
  border-radius: 5px;
  font-size: 10.5px;
}

.slash-item .mono {
  color: var(--accent);
  min-width: 36px;
}

.slash-item kbd {
  margin-left: auto;
}

.slash-item--hot {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}

.keys {
  justify-self: end;
  display: flex;
  gap: 4px;
}

/* ── Theme picker ─────────────────────────────────── */
.vis-theme {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-card {
  appearance: none;
  display: grid;
  gap: 8px;
  padding: 8px;
  border-radius: var(--ob-radius);
  border: 1.5px solid var(--border);
  background: var(--bg-elev);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition: border-color 160ms ease, transform 160ms ease, box-shadow 200ms ease;
}

.theme-card:hover {
  transform: translateY(-2px);
}

.theme-card--on {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent), 0 14px 30px rgba(0, 0, 0, 0.2);
}

.theme-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-preview {
  display: grid;
  grid-template-columns: 34% 1fr;
  height: 92px;
  border-radius: 8px;
  overflow: hidden;
}

.theme-card--dark .theme-preview { background: #0b1220; --l: #25314a; --s: #121a2b; }
.theme-card--light .theme-preview { background: #f5f7fb; --l: #cbd5e1; --s: #ffffff; }

.tp-side {
  display: grid;
  align-content: start;
  gap: 5px;
  padding: 8px 6px;
  background: var(--s);
  border-right: 1px solid var(--l);
}

.tp-main {
  display: grid;
  align-content: start;
  gap: 6px;
  padding: 10px 8px;
}

.tp-side i,
.tp-main i {
  height: 5px;
  border-radius: 3px;
  background: var(--l);
}

.tp-main i:nth-child(2) { width: 70%; }

.tp-main .tp-accent {
  width: 40%;
  height: 8px;
  margin-top: 6px;
  background: #22c55e;
}

.theme-name {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 2px 2px;
  font-size: 12px;
  font-weight: 600;
}

.theme-radio {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.theme-card--on .theme-radio {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 3px var(--bg-elev), inset 0 0 0 7px var(--accent);
}

/* ── Ready visual ─────────────────────────────────── */
.vis-ready {
  display: grid;
  place-items: center;
  height: 220px;
}

.ready-badge {
  position: relative;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--ob-sky));
  box-shadow: 0 16px 40px color-mix(in srgb, var(--accent) 45%, transparent);
  animation: pop-in 600ms cubic-bezier(.2, 1.4, .4, 1) both;
}

.ready-badge svg {
  width: 40px;
  height: 40px;
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: draw 500ms ease-out 350ms forwards;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--accent) 45%, transparent);
  animation: ripple 2.8s ease-out infinite;
}

.ring--1 { width: 84px; height: 84px; }
.ring--2 { width: 84px; height: 84px; animation-delay: 1.4s; }

.spark {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--accent);
  --angle: calc(var(--n) * 45deg);
  animation: burst 900ms cubic-bezier(.2, .8, .2, 1) 250ms both;
}

.spark:nth-child(odd) { background: var(--ob-sky); }
.spark:nth-child(3n) { background: var(--ob-amber); }

/* ── Step transitions ─────────────────────────────── */
.ob-fade-enter-active,
.ob-fade-leave-active {
  transition: opacity 260ms ease;
}

.ob-fade-enter-from,
.ob-fade-leave-to {
  opacity: 0;
}

.ob-next-enter-active,
.ob-next-leave-active,
.ob-prev-enter-active,
.ob-prev-leave-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(.2, .8, .2, 1);
}

.ob-next-enter-from,
.ob-prev-leave-to {
  opacity: 0;
  transform: translateX(28px);
}

.ob-next-leave-to,
.ob-prev-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}

/* ── Keyframes ────────────────────────────────────── */
@keyframes drift {
  to { transform: translate(-30px, 30px) scale(1.1); }
}

@keyframes rise {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

@keyframes float {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -5px; }
}

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(45deg); }
}

@keyframes highlight {
  0%, 100% { background: color-mix(in srgb, var(--accent) 14%, transparent); }
  50% { background: color-mix(in srgb, var(--accent) 30%, transparent); }
}

@keyframes cursor-move {
  0% { left: 70%; top: 90%; }
  25% { left: 58%; top: 108px; }
  30%, 70% { left: 58%; top: 108px; transform: scale(0.88); }
  35%, 65% { transform: scale(1); }
  100% { left: 70%; top: 90%; }
}

@keyframes ctx-pop {
  0%, 28% { opacity: 0; transform: scale(0.85); }
  34%, 80% { opacity: 1; transform: scale(1); }
  88%, 100% { opacity: 0; transform: scale(0.95); }
}

@keyframes sub-pop {
  0%, 40% { opacity: 0; transform: scale(0.85); }
  46%, 80% { opacity: 1; transform: scale(1); }
  88%, 100% { opacity: 0; transform: scale(0.95); }
}

@keyframes pick {
  0%, 55% { background: transparent; }
  62%, 80% { background: color-mix(in srgb, var(--accent) 22%, transparent); }
  100% { background: transparent; }
}

@keyframes active-row {
  0%, 100% { background: color-mix(in srgb, var(--accent) 12%, transparent); }
  50% { background: color-mix(in srgb, var(--accent) 20%, transparent); }
}

@keyframes drag-row {
  0%, 10%, 90%, 100% { transform: none; box-shadow: none; }
  20%, 30% { transform: translate(6px, -2px) rotate(-1deg); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25); background: var(--bg-elev-2); }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 50%, transparent); }
  50% { box-shadow: 0 0 0 4px transparent; }
}

@keyframes form-in {
  0%, 8% { opacity: 0; transform: translateY(8px); }
  16%, 90% { opacity: 1; transform: none; }
  100% { opacity: 0; transform: translateY(-4px); }
}

@keyframes type {
  0%, 20% { width: 0; }
  60%, 100% { width: 7ch; }
}

@keyframes type-slash {
  0%, 10% { width: 0; }
  40%, 100% { width: 3ch; }
}

@keyframes slash-pop {
  0%, 30% { opacity: 0; transform: translateY(-4px) scale(0.96); }
  40%, 88% { opacity: 1; transform: none; }
  100% { opacity: 0; }
}

@keyframes blink {
  50% { opacity: 0; }
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.4); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}

@keyframes ripple {
  from { opacity: 0.9; transform: scale(1); }
  to { opacity: 0; transform: scale(2.2); }
}

@keyframes burst {
  from { opacity: 1; transform: rotate(var(--angle)) translateX(0) scale(1); }
  to { opacity: 0; transform: rotate(var(--angle)) translateX(80px) scale(0.4); }
}

@media (prefers-reduced-motion: reduce) {
  .ob *,
  .ob *::before,
  .ob *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }

  .ctx,
  .page-menu,
  .page-submenu,
  .slash-menu,
  .form {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .typed { width: 7ch; animation: none !important; }
  .typing { width: 3ch; animation: none !important; }
}

@media (max-width: 520px) {
  .ob-step {
    grid-template-columns: 1fr;
    align-content: start;
  }

  .ob-visual {
    display: none;
  }
}
</style>
