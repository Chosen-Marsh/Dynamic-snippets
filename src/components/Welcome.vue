<template>
	<section class="welcome" :aria-label="$t('welcome.ariaLabel')">
		<header class="hero">
			<p class="eyebrow">{{ $t('app.name') }}</p>
			<h1>{{ $t('welcome.heading') }}</h1>
			<p class="lead">{{ $t('welcome.lead') }}</p>
			<div class="hero-actions">
				<Button variant="primary" icon="file" @click="emit('create-snippet')">
					{{ $t('welcome.newSnippet') }}
				</Button>
				<Button variant="secondary" @click="emit('start-tour')">
					{{ $t('welcome.tour') }}
				</Button>
			</div>
		</header>

		<section class="block" aria-labelledby="welcome-insert-title">
			<h2 id="welcome-insert-title" class="block-title">{{ $t('welcome.insertTitle') }}</h2>
			<div class="methods">
				<article class="method">
					<span class="method-icon" aria-hidden="true">
						<svg viewBox="0 0 16 16" fill="none">
							<path d="M4 2.5v9l2.6-2.4 1.8 4.1 1.6-.7-1.8-4h3.5L4 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
						</svg>
					</span>
					<div>
						<h3>{{ $t('welcome.contextMenu.title') }}</h3>
						<p>{{ $t('welcome.contextMenu.text', { menu: $t('background.insertSnippetMenu') }) }}</p>
					</div>
				</article>
				<article class="method">
					<span class="method-icon method-icon--slash" aria-hidden="true">/</span>
					<div>
						<h3>{{ $t('welcome.slash.title') }}</h3>
						<p>{{ $t('welcome.slash.text') }}</p>
					</div>
				</article>
			</div>
		</section>

		<section class="block" aria-labelledby="welcome-vars-title">
			<div class="block-head">
				<h2 id="welcome-vars-title" class="block-title">{{ $t('welcome.variablesTitle') }}</h2>
				<span class="block-hint">{{ $t('welcome.variablesHint') }}</span>
			</div>
			<ul class="vars">
				<li v-for="variable in VARIABLES" :key="variable.id" class="var">
					<div class="var-label">
						<span class="var-name">{{ $t(`welcome.${variable.id}.title`) }}</span>
						<span class="var-desc">{{ $t(`welcome.${variable.id}.text`) }}</span>
					</div>
					<code class="var-token">{{ variable.token }}</code>
				</li>
			</ul>
		</section>

		<footer class="foot">
			<span class="version">{{ $t('changelog.version', { version: APP_VERSION }) }}</span>
			<button class="history-btn" type="button" @click="emit('view-history')">
				{{ $t('welcome.viewHistory') }}
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
		</footer>
	</section>
</template>

<script setup>
import Button from './Button.vue';
import { APP_VERSION } from '../version.js';

const emit = defineEmits(['create-snippet', 'start-tour', 'view-history']);

const VARIABLES = [
	{ id: 'dropdown', token: '${{env-dropdown|dev,staging,prod}' },
	{ id: 'text', token: '${ticket-text|ABC-123}' },
	{ id: 'date', token: '${due-date|2025-07-25}' },
	{ id: 'global', token: '${username-global}' }
];
</script>

<style scoped>
.welcome {
	display: flex;
	flex-direction: column;
	gap: 16px;
	flex: 1;
	min-width: 0;
	overflow-y: auto;
	overflow-x: hidden;
	padding: 18px 18px 14px;
	background: var(--welcome-bg, linear-gradient(180deg, var(--bg-elev) 0%, var(--bg) 100%));
	border-left: 1px solid var(--border);
}

/* Hero */
.hero {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.eyebrow {
	margin: 0 0 6px;
	color: var(--accent);
	font-size: 10px;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	font-weight: 700;
}

.hero h1 {
	margin: 0;
	color: var(--text);
	font-size: 19px;
	line-height: 1.2;
	font-weight: 650;
}

.lead {
	margin: 6px 0 12px;
	color: var(--muted);
	font-size: 12px;
	line-height: 1.5;
	max-width: 46ch;
}

.hero-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

/* Sections */
.block {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.block-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
}

.block-title {
	margin: 0;
	color: var(--muted);
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

.block-hint {
	color: var(--muted);
	font-size: 10.5px;
	opacity: 0.85;
	text-align: right;
}

/* Insert methods */
.methods {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.method {
	display: flex;
	gap: 9px;
	align-items: flex-start;
	padding: 10px;
	background: var(--bg-elev-2);
	border: 1px solid var(--border);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-sm);
}

.method-icon {
	flex-shrink: 0;
	display: grid;
	place-items: center;
	width: 24px;
	height: 24px;
	border-radius: var(--radius-sm);
	color: var(--accent);
	background: var(--accent-soft);
}

.method-icon svg {
	width: 14px;
	height: 14px;
}

.method-icon--slash {
	font-family: "Cascadia Code", "Consolas", monospace;
	font-size: 13px;
	font-weight: 700;
}

.method h3 {
	margin: 0 0 3px;
	color: var(--text);
	font-size: 12px;
	font-weight: 650;
}

.method p {
	margin: 0;
	color: var(--muted);
	font-size: 11px;
	line-height: 1.4;
}

/* Variable reference */
.vars {
	list-style: none;
	margin: 0;
	padding: 0;
	border: 1px solid var(--border);
	border-radius: var(--radius-lg);
	background: var(--bg-elev-2);
	box-shadow: var(--shadow-sm);
	overflow: hidden;
}

.var {
	display: grid;
	grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
	gap: 10px;
	align-items: center;
	padding: 7px 10px;
}

.var + .var {
	border-top: 1px solid var(--border);
}

.var-label {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.var-name {
	color: var(--text);
	font-size: 12px;
	font-weight: 650;
}

.var-desc {
	color: var(--muted);
	font-size: 10.5px;
	line-height: 1.35;
}

.var-token {
	justify-self: stretch;
	padding: 4px 6px;
	color: var(--accent);
	background: var(--code-bg);
	border: 1px solid var(--code-border);
	border-radius: var(--radius-sm);
	font-size: 10.5px;
	line-height: 1.4;
	overflow-wrap: anywhere;
}

/* Footer */
.foot {
	margin-top: auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding-top: 10px;
	border-top: 1px solid var(--border);
}

.version {
	color: var(--muted);
	font-size: 11px;
}

.history-btn {
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 6px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: var(--accent);
	font: inherit;
	font-size: 11px;
	font-weight: 700;
	cursor: pointer;
	transition: background 160ms ease;
}

.history-btn svg {
	width: 12px;
	height: 12px;
	transition: transform 160ms ease;
}

.history-btn:hover {
	background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.history-btn:hover svg {
	transform: translateX(2px);
}

.history-btn:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

@media (max-width: 680px) {
	.welcome {
		padding: 14px;
		gap: 14px;
	}

	.hero h1 {
		font-size: 17px;
	}
}
</style>
