<template>
  <teleport to="body">
    <div v-if="visible" class="consent-overlay">
      <section class="consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <header class="consent-header">
          <div class="consent-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 19V5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="17" cy="7" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div class="consent-heading">
            <p class="consent-eyebrow">Privacy first</p>
            <h2 id="consent-title">Help improve Dynamic Snippets?</h2>
            <p class="consent-lead">
              Optional analytics track feature usage only — never your snippet content.
            </p>
          </div>
        </header>

        <div class="consent-body">
          <div class="consent-grid">
            <article class="consent-card consent-card--yes">
              <h3>Collected</h3>
              <ul>
                <li>Action names only</li>
                <li>Local timestamps</li>
              </ul>
            </article>
            <article class="consent-card consent-card--no">
              <h3>Never collected</h3>
              <ul>
                <li>Snippet content</li>
                <li>Variable values</li>
                <li>Personal data</li>
              </ul>
            </article>
          </div>
          <p class="consent-note">Stored on your device only. Change anytime in Settings.</p>
        </div>

        <footer class="consent-footer">
          <button type="button" class="btn btn-decline" @click="emit('decline')">No thanks</button>
          <button type="button" class="btn btn-accept" @click="emit('accept')">Allow analytics</button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false }
});

const emit = defineEmits(['accept', 'decline']);
</script>

<style scoped>
.consent-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(6px);
}

.consent-modal {
  width: min(560px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(165deg, var(--bg-elev) 0%, var(--bg-elev-2) 100%);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.consent-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.consent-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  color: var(--accent);
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.consent-icon svg {
  width: 18px;
  height: 18px;
}

.consent-heading {
  min-width: 0;
}

.consent-eyebrow {
  margin: 0 0 2px;
  color: var(--accent);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.consent-header h2 {
  margin: 0;
  font-size: 15px;
  line-height: 1.25;
  color: var(--text);
}

.consent-lead {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
}

.consent-body {
  padding: 12px 16px;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
}

.consent-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.consent-card {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.35);
}

.consent-card h3 {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.consent-card--yes h3 {
  color: var(--accent);
}

.consent-card--no h3 {
  color: #f87171;
}

.consent-card ul {
  margin: 0;
  padding-left: 14px;
  color: var(--text);
  font-size: 11px;
  line-height: 1.4;
}

.consent-card li + li {
  margin-top: 2px;
}

.consent-note {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.4;
  text-align: center;
}

.consent-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.btn {
  appearance: none;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-decline {
  color: var(--text);
  background: var(--bg-elev-2);
  border-color: var(--border);
}

.btn-accept {
  color: #ecfdf5;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
}
</style>
