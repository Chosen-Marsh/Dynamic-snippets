<template>
    <div class="footer">
      <button class="footer-settings-btn" type="button" title="Settings" @click="$emit('open-settings')">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.078 1h-2.156l-.396 2.377a6.53 6.53 0 00-1.627.674L4.78 2.836 3.254 4.362l1.215 2.12a6.53 6.53 0 00-.674 1.626L1.418 8.504v2.156l2.377.396c.169.576.393 1.12.674 1.627l-1.215 2.119 1.526 1.526 2.12-1.215a6.53 6.53 0 001.626.674l.396 2.377h2.156l.396-2.377a6.53 6.53 0 001.627-.674l2.119 1.215 1.526-1.526-1.215-2.12c.281-.506.505-1.05.674-1.626l2.377-.396V8.504l-2.377-.396a6.53 6.53 0 00-.674-1.627l1.215-2.119-1.526-1.526-2.12 1.215a6.53 6.53 0 00-1.626-.674L11.078 1z"
            stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="10" cy="9.582" r="2.75" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
    </div>
</template>

<script setup>
defineEmits(['open-settings']);
</script>

<style scoped>
.footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 6px 10px;
    border-top: 1px solid var(--border);
}

.footer-settings-btn {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--muted);
    border-radius: 6px;
    cursor: pointer;
    transition: color 120ms, background 120ms;
}

.footer-settings-btn:hover {
    color: var(--text);
    background: var(--bg-elev-2);
}
</style>
