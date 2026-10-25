<template>
    <div class="footer">
        <span class="footer-dot" :style="{ background: content ? 'var(--accent)' : 'var(--muted)' }"></span>
        <span class="footer-text">
            {{ lastSavedAt
                ? $t('footer.lastSavedAt', { time: new Date(lastSavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) })
                : $t('footer.notSavedYet') }}
        </span>
    </div>
</template>

<script setup>
defineEmits(['open-settings']);

const props = defineProps({
    content: {
        type: String,
        required: true
    },
    lastSavedAt: {
        type: String,
        required: false
    }
});


</script>

<style scoped>
.footer {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    height: 41px;
    box-sizing: border-box;
    padding: 6px 10px;
    border-top: 1px solid var(--border);
}
.footer-text {
    text-align: left;
    color: var(--muted);
    margin-left: 8px;
}
.footer-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
}
</style>
