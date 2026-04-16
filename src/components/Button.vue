<script setup>
import { computed } from 'vue';

const iconMap = {
  'export': `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2v8M5 4l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'import': `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 10V2M5 8l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'chevron': `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'file': `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M9.5 1v4h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'folder': `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 5.5A1.5 1.5 0 013.5 4h2.879a1.5 1.5 0 011.06.44l.622.621A1.5 1.5 0 009.12 5.5H12.5A1.5 1.5 0 0114 7v4.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12V5.5z" fill="currentColor"/>
  </svg>`
};

const props = defineProps({
    variant: {
        type: String,
        default: 'primary'
    },
    type: {
        type: String,
        default: 'button'
    },
    disabled: {
        type: Boolean,
        default: false
    },
    icon: {
        type: String,
        default: null
    },
    iconPosition: {
        type: String,
        default: 'left',
        validator: (value) => ['left', 'right'].includes(value)
    },
    iconSize: {
        type: Number,
        default: 12
    }
});

const resolvedIcon = computed(() => {
  return props.icon ? (iconMap[props.icon] || props.icon) : null;
});
</script>

<template>
    <button :type="type" class="btn" :class="`btn-${props.variant}`" :disabled="disabled" :style="{ '--icon-size': iconSize + 'px' }">
        <span v-if="resolvedIcon" :class="['btn-icon', `icon-${iconPosition}`]" v-html="resolvedIcon"></span>
        <slot></slot>
    </button>
</template>

<style scoped>
.btn {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    color: #f9fafb;
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 180ms ease, background-color 180ms ease;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-icon :deep(svg) {
    width: var(--icon-size, 12px);
    height: var(--icon-size, 12px);
}

.icon-right {
    order: 1;
}

.btn:hover:not(:disabled) {
    transform: translateY(-1px);
}

.btn:active:not(:disabled) {
    transform: translateY(0);
}

.btn:focus-visible {
    outline: 2px solid rgba(34, 197, 94, 0.55);
    outline-offset: 2px;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
    box-shadow: 0 8px 20px rgba(34, 197, 94, 0.24);
}

.btn-primary:hover:not(:disabled) {
    box-shadow: 0 10px 24px rgba(34, 197, 94, 0.3);
}

.btn-secondary {
    background: linear-gradient(135deg, var(--secondary) 0%, var(--secondary-strong) 100%);
    border-color: #475569;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.36);
}

.btn-ghost {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    color: var(--muted);
}

.btn-ghost:hover:not(:disabled) svg {
    color: var(--text);
}

.btn-ghost:hover:not(:disabled) {
    background: var(--bg-elev-2);
    box-shadow: none;
}

.btn-danger {
    background: linear-gradient(135deg, var(--danger) 0%, var(--danger-strong) 100%);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.28);
}
</style>