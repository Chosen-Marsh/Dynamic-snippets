<template>
	<teleport to="body">
		<div v-if="visible" class="var-modal-overlay" @mousedown.self="emit('close')">
			<section class="var-modal" role="dialog" aria-modal="true" aria-label="Insert global variable">
				<header class="var-modal-header">
					<h3>Insert Global Variable</h3>
					<button class="var-modal-close" type="button" @click="emit('close')" aria-label="Close">
						x
					</button>
				</header>

				<div class="var-modal-body">
					<p class="help-text">
						Pick a global variable from Settings. Missing keys paste as <code>undefined</code> at
						insert time.
					</p>

					<label v-if="globalVarOptions.length" class="field">
						<span class="field-label">Global variable</span>
						<select ref="keySelect" v-model="selectedKey" class="field-input">
							<option v-for="option in globalVarOptions" :key="option.key" :value="option.key">
								{{ option.label }}
							</option>
						</select>
					</label>

					<p v-else class="empty-state">
						No global variables yet. Add them in Settings → Global Variables.
					</p>

					<div v-if="selectedKey" class="preview-wrap">
						<span class="field-label">Preview</span>
						<code class="preview">{{ tokenPreview }}</code>
					</div>
				</div>

				<footer class="var-modal-footer">
					<button class="btn btn-ghost" type="button" @click="emit('close')">Cancel</button>
					<button class="btn btn-primary" type="button" :disabled="!canInsert" @click="handleInsert">
						Insert
					</button>
				</footer>
			</section>
		</div>
	</teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import globalVariables from '../services/GlobalVariables.js';

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	}
});

const emit = defineEmits(['close', 'insert']);

const selectedKey = ref('');
const globalVarOptions = ref([]);
const keySelect = ref(null);

const tokenPreview = computed(() => {
	if (!selectedKey.value) return '';
	return `\${${selectedKey.value}-global}`;
});

const canInsert = computed(() => Boolean(selectedKey.value));

function handleInsert() {
	if (!canInsert.value) return;
	emit('insert', tokenPreview.value);
}

watch(() => props.visible, async (isVisible) => {
	if (!isVisible) return;
	selectedKey.value = '';
	const globals = await globalVariables.getAll();
	globalVarOptions.value = Object.entries(globals)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => ({
			key,
			label: value ? `${key} (${value})` : key
		}));
	selectedKey.value = globalVarOptions.value[0]?.key || '';
	await nextTick();
	keySelect.value?.focus();
});
</script>

<style scoped>
.var-modal-overlay {
	position: fixed;
	inset: 0;
	z-index: 2000;
	display: grid;
	place-items: center;
	background: rgba(2, 6, 23, 0.62);
	backdrop-filter: blur(4px);
	padding: 16px;
}

.var-modal {
	width: min(480px, 100%);
	border-radius: 12px;
	border: 1px solid var(--border);
	background: linear-gradient(170deg, #111827 0%, #0f172a 48%, #111827 100%);
	box-shadow: 0 28px 60px rgba(2, 6, 23, 0.5);
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.var-modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 14px;
	border-bottom: 1px solid var(--border);
}

.var-modal-header h3 {
	margin: 0;
	font-size: 14px;
	font-weight: 700;
	color: var(--text);
}

.var-modal-close {
	border: none;
	background: transparent;
	color: var(--muted);
	cursor: pointer;
	font-size: 13px;
	width: 24px;
	height: 24px;
	border-radius: 6px;
}

.var-modal-close:hover {
	background: var(--bg-elev-2);
	color: var(--text);
}

.var-modal-body {
	padding: 14px;
	display: grid;
	gap: 10px;
}

.help-text {
	margin: 0;
	color: var(--muted);
	font-size: 12px;
	line-height: 1.45;
}

.help-text code {
	color: #7dd3fc;
	font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
	font-size: 11px;
}

.empty-state {
	margin: 0;
	color: var(--muted);
	font-size: 12px;
	line-height: 1.45;
}

.field {
	display: grid;
	gap: 6px;
}

.field-label {
	color: var(--muted);
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.field-input {
	width: 100%;
	border: 1px solid var(--border);
	background: rgba(15, 23, 42, 0.75);
	color: var(--text);
	border-radius: 8px;
	padding: 9px 10px;
	outline: none;
	font-size: 12px;
}

.field-input:focus {
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
}

.preview-wrap {
	display: grid;
	gap: 6px;
}

.preview {
	display: block;
	border-radius: 8px;
	border: 1px dashed #2b445f;
	background: rgba(8, 47, 73, 0.3);
	color: #7dd3fc;
	font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
	font-size: 12px;
	line-height: 1.45;
	padding: 10px;
	min-height: 38px;
	overflow-wrap: anywhere;
}

.var-modal-footer {
	border-top: 1px solid var(--border);
	padding: 12px 14px;
	display: flex;
	justify-content: flex-end;
	gap: 8px;
}

.btn {
	appearance: none;
	border-radius: 8px;
	border: 1px solid transparent;
	padding: 7px 12px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn-primary {
	color: #ecfdf5;
	background: linear-gradient(135deg, var(--accent), var(--accent-strong));
}

.btn-ghost {
	color: var(--text);
	background: var(--bg-elev-2);
	border-color: var(--border);
}
</style>
