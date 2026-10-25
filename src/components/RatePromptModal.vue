<template>
  <teleport to="body">
    <div v-if="visible" class="rate-overlay" aria-live="polite">
      <section class="rate-modal" role="dialog" aria-modal="true" aria-labelledby="rate-title">
        <header class="rate-header">
          <div class="rate-icon" aria-hidden="true">★</div>
          <div class="rate-heading">
            <p class="rate-eyebrow">{{ $t('rate.eyebrow') }}</p>
            <h2 id="rate-title">{{ $t('rate.title') }}</h2>
          </div>
        </header>

        <div class="rate-body">
          <p class="rate-text">
            {{ $t('rate.text') }}
          </p>
          <div class="stars" :aria-label="$t('rate.starsLabel')">★★★★★</div>
        </div>

        <footer class="rate-footer">
          <button type="button" class="btn btn-secondary" @click="emit('dismiss')">{{ $t('rate.dismiss') }}</button>
          <button type="button" class="btn btn-ghost" @click="emit('later')">{{ $t('rate.later') }}</button>
          <button type="button" class="btn btn-primary" @click="emit('accept')">{{ $t('rate.accept') }}</button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false }
});

const emit = defineEmits(['accept', 'dismiss', 'later']);
</script>

<style scoped>
.rate-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(2, 6, 23, 0.74);
  backdrop-filter: blur(8px);
}

.rate-modal {
  width: min(500px, 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
    radial-gradient(120% 160% at 0% 0%, rgba(250, 204, 21, 0.14) 0%, rgba(250, 204, 21, 0) 44%),
    linear-gradient(165deg, var(--bg-elev) 0%, var(--bg-elev-2) 100%);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.46);
}

.rate-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 18px 10px;
}

.rate-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(250, 204, 21, 0.14);
  border: 1px solid rgba(250, 204, 21, 0.3);
  color: #facc15;
  font-size: 22px;
}

.rate-eyebrow {
  margin: 0 0 4px;
  color: #facc15;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.rate-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 22px;
  line-height: 1.2;
}

.rate-body {
  padding: 6px 18px 0;
}

.rate-text {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.stars {
  margin-top: 15px;
  font-size: 28px;
  letter-spacing: 6px;
  color: #facc15;
  text-shadow: 0 0 18px rgba(250, 204, 21, 0.35);
}

.rate-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 18px;
  border-top: 1px solid var(--border);
}

.btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 10px;
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

.btn-primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
  color: white;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.25);
}

.btn-secondary {
  background: rgba(15, 23, 42, 0.6);
  border-color: var(--border);
  color: var(--text);
}

.btn-ghost {
  background: transparent;
  border-color: rgba(148, 163, 184, 0.3);
  color: var(--muted);
}
</style>
