<template>
	<teleport to="body">
		<div v-if="visible" class="var-modal-overlay" @mousedown.self="emit('close')">
			<section class="var-modal" role="dialog" aria-modal="true" aria-label="Insert variable">
				<header class="var-modal-header">
					<h3>Insert Variable</h3>
					<button class="var-modal-close" type="button" @click="emit('close')" aria-label="Close">
						x
					</button>
				</header>

				<div class="var-modal-body">
					<label class="field">
						<span class="field-label">Type</span>
						<select v-model="varType" class="field-input">
							<option v-for="option in variableTypeOptions" :key="option.value" :value="option.value">
								{{ option.label }}
							</option>
						</select>
					</label>

					<label class="field">
						<span class="field-label">Key</span>
						<input
							ref="keyInput"
							v-model="keyName"
							class="field-input"
							type="text"
							placeholder="example: env"
						/>
					</label>

					<label v-if="varType === 'dropdown'" class="field">
						<span class="field-label">Options (comma separated)</span>
						<input
							v-model="dropdownOptions"
							class="field-input"
							type="text"
							placeholder="dev,staging,prod"
						/>
					</label>

					<label v-else class="field">
						<span class="field-label">Default value</span>
						<input
							v-model="defaultValue"
							class="field-input"
							:class="{ 'field-input--date': varType === 'date' }"
							:type="varType === 'date' ? 'date' : 'text'"
							:placeholder="varType === 'date' ? 'yyyy-mm-dd' : 'my-default'"
						/>
					</label>

					<div class="preview-wrap">
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
import { buildVariableToken, parseCsvOptions, VARIABLE_TYPE_OPTIONS } from '../variables/typeRegistry.js';

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	}
});

const emit = defineEmits(['close', 'insert']);

const variableTypeOptions = VARIABLE_TYPE_OPTIONS;

const varType = ref('dropdown');
const keyName = ref('');
const dropdownOptions = ref('value1,value2');
const defaultValue = ref('defaultvalue');
const keyInput = ref(null);

const normalizedKey = computed(() => keyName.value.trim());
const normalizedOptions = computed(() => {
	return parseCsvOptions(dropdownOptions.value).join(',');
});

const tokenPreview = computed(() => {
	return buildVariableToken({
		type: varType.value,
		key: normalizedKey.value,
		options: normalizedOptions.value,
		defaultValue: defaultValue.value
	});
});

const canInsert = computed(() => {
	if (!normalizedKey.value) return false;
	if (varType.value === 'dropdown') return Boolean(normalizedOptions.value);
	return true;
});

function handleInsert() {
	if (!canInsert.value) return;
	emit('insert', tokenPreview.value);
}

watch(() => props.visible, async (isVisible) => {
	if (!isVisible) return;
	await nextTick();
	keyInput.value?.focus();
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
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: rgba(34, 197, 94, 0.72) rgba(15, 23, 42, 0.35);
}

.var-modal-overlay::-webkit-scrollbar {
	width: 10px;
}

.var-modal-overlay::-webkit-scrollbar-track {
	background: rgba(15, 23, 42, 0.35);
}

.var-modal-overlay::-webkit-scrollbar-thumb {
	background: linear-gradient(180deg, rgba(34, 197, 94, 0.72), rgba(22, 163, 74, 0.78));
	border-radius: 999px;
	border: 2px solid rgba(15, 23, 42, 0.35);
}

.var-modal-overlay::-webkit-scrollbar-thumb:hover {
	background: linear-gradient(180deg, rgba(74, 222, 128, 0.86), rgba(34, 197, 94, 0.92));
}

.var-modal {
	width: min(520px, 100%);
	max-height: calc(100dvh - 32px);
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
	overflow-y: auto;
	min-height: 0;
	scrollbar-width: thin;
	scrollbar-color: rgba(34, 197, 94, 0.72) rgba(15, 23, 42, 0.4);
}

.var-modal-body::-webkit-scrollbar {
	width: 10px;
}

.var-modal-body::-webkit-scrollbar-track {
	background: rgba(15, 23, 42, 0.4);
	border-radius: 999px;
	margin: 8px 0;
}

.var-modal-body::-webkit-scrollbar-thumb {
	background: linear-gradient(180deg, rgba(34, 197, 94, 0.72), rgba(22, 163, 74, 0.78));
	border-radius: 999px;
	border: 2px solid rgba(15, 23, 42, 0.4);
}

.var-modal-body::-webkit-scrollbar-thumb:hover {
	background: linear-gradient(180deg, rgba(74, 222, 128, 0.86), rgba(34, 197, 94, 0.92));
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

.field-input--date {
	border-color: var(--border);
	background: rgba(15, 23, 42, 0.75);
	color-scheme: dark;
	font-weight: 600;
	letter-spacing: 0;
	padding-right: 42px;
	appearance: none;
	-webkit-appearance: none;
}

.field-input--date::-webkit-calendar-picker-indicator {
	filter: brightness(0) invert(1);
	opacity: 1;
	margin-left: auto;
	padding: 0;
	width: 16px;
	height: 16px;
	cursor: pointer;
}

.field-input--date::-webkit-calendar-picker-indicator:hover {
	filter: brightness(0) invert(1);
	opacity: 0.9;
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
	flex-shrink: 0;
}

.btn {
	appearance: none;
	border-radius: 8px;
	border: 1px solid transparent;
	padding: 7px 12px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	transition: transform 120ms ease, box-shadow 160ms ease;
}

.btn:hover:not(:disabled) {
	transform: translateY(-1px);
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn-primary {
	color: #ecfdf5;
	background: linear-gradient(135deg, var(--accent), var(--accent-strong));
	box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}

.btn-ghost {
	color: var(--text);
	background: var(--bg-elev-2);
	border-color: var(--border);
}

@media (max-height: 620px) {
	.var-modal-overlay {
		place-items: start center;
		padding-top: 10px;
		padding-bottom: 10px;
	}

	.var-modal {
		max-height: calc(100dvh - 20px);
	}
}
</style>
