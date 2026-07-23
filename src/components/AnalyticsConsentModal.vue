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
            <p class="consent-eyebrow">Optional analytics</p>
            <h2 id="consent-title">Help us improve Dynamic Snippets</h2>
            <p class="consent-lead">
              We collect anonymous usage events only, and never capture your snippets or personal data.
            </p>
          </div>
        </header>

        <div class="consent-body">
          <div class="consent-grid" aria-label="Data collection details">
            <article class="consent-card">
              <h3>What we collect</h3>
              <ul>
                <li>Feature and button usage</li>
                <li>Local timestamps</li>
              </ul>
            </article>
            <article class="consent-card consent-card--protected">
              <h3>What we never collect</h3>
              <ul>
                <li>Snippet content</li>
                <li>Variable values</li>
                <li>Personal data</li>
              </ul>
            </article>
          </div>
          <p class="consent-note">Your preference is stored locally in this extension.</p>
        </div>

        <footer class="consent-footer">
          <button type="button" class="btn btn-decline" @click="emit('decline')">Not now</button>
          <button type="button" class="btn btn-accept" @click="emit('accept')">Allow anonymous analytics</button>
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
  padding: 14px;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(8px);
}

.consent-modal {
  width: min(560px, 100%);
  max-height: calc(100dvh - 20px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background:
    radial-gradient(120% 160% at 0% 0%, rgba(34, 197, 94, 0.14) 0%, rgba(34, 197, 94, 0) 44%),
    linear-gradient(165deg, var(--bg-elev) 0%, var(--bg-elev-2) 100%);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.45);
}

.consent-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.consent-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  color: var(--accent);
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.consent-icon svg {
  width: 20px;
  height: 20px;
}

.consent-heading {
  min-width: 0;
}

.consent-eyebrow {
  margin: 0 0 4px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.consent-header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--text);
}

.consent-lead {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.consent-body {
  padding: 14px 18px;
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
  padding: 10px 11px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.3);
}

.consent-card h3 {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text);
}

.consent-card--protected {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.08);
}

.consent-card ul {
  margin: 0;
  padding-left: 14px;
  color: var(--text);
  font-size: 11px;
  line-height: 1.4;
}

.consent-card li + li {
  margin-top: 3px;
}

.consent-note {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
  text-align: center;
}

.consent-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.btn {
  appearance: none;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-decline {
  color: var(--text);
  background: var(--bg-elev-2);
  border-color: var(--border);
  min-width: 110px;
}

.btn-accept {
  color: #ecfdf5;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.35);
}

@media (max-width: 460px) {
  .consent-modal {
    border-radius: 16px;
  }

  .consent-header {
    padding: 16px 14px 12px;
  }

  .consent-header h2 {
    font-size: 18px;
  }

  .consent-lead {
    font-size: 12px;
  }

  .consent-body {
    padding: 12px 14px;
  }

  .consent-grid {
    grid-template-columns: 1fr;
  }

  .consent-footer {
    flex-direction: column-reverse;
    align-items: stretch;
    padding: 12px 14px 14px;
  }

  .btn {
    width: 100%;
  }
}
</style>
