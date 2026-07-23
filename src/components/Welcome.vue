<template>
	<section class="welcome" aria-label="Welcome">
		<div class="ambient ambient-a" />
		<div class="ambient ambient-b" />

		<header class="hero">
			<p class="eyebrow">Dynamic Snippets</p>
			<h1>Build smart snippets in seconds</h1>
			<p class="lead">
				Select a snippet on the left or create one from the sidebar menu. Use variables to
				fill values quickly at insert time.
			</p>
		</header>

		<div class="guide-grid">
			<article class="guide-card">
				<h2>Dropdown Variable</h2>
				<p>Choose from predefined values at paste time.</p>
				<code v-pre>${{environment-dropdown|dev,staging,production}</code>
			</article>

			<article class="guide-card">
				<h2>Text Input Variable</h2>
				<p>Prompt for custom values before inserting.</p>
				<code v-pre>${ticket-text|ABC-123}</code>
			</article>

			<article class="guide-card">
				<h2>Date Variable</h2>
				<p>Pick a date and insert it using your local date format.</p>
				<code v-pre>${dueDate-date|2026-07-25}</code>
			</article>

			<article class="guide-card">
				<h2>Global Variable</h2>
				<p>Uses a value from Settings. Missing keys paste as <code>undefined</code>.</p>
				<code v-pre>${username-global}</code>
			</article>
		</div>

		<footer class="tips">
			<span class="tip">Tip: Right-click in the editor to add variables quickly.</span>
			<span class="tip">Tip: Use folders to group snippets by project or workflow.</span>
			<span class="tip">Tip: Date variables insert in your browser's local format.</span>
			<button class="history-btn" type="button" @click="emit('view-history')">View version history</button>
		</footer>
	</section>
</template>

<script setup>
const emit = defineEmits(['view-history']);
</script>

<style scoped>
.welcome {
	position: relative;
	display: grid;
	grid-template-rows: auto auto 1fr;
	gap: 14px;
	flex: 1;
	min-width: 0;
	overflow-y: auto;
	overflow-x: hidden;
	padding: 18px;
	background: var(--welcome-bg, linear-gradient(180deg, var(--bg-elev) 0%, var(--bg) 100%));
	border-left: 1px solid var(--border);
	scrollbar-width: thin;
	scrollbar-color: var(--accent) var(--bg-elev-2);
}

.welcome::-webkit-scrollbar {
	width: 10px;
}

.welcome::-webkit-scrollbar-track {
	background: var(--bg-elev-2);
	border-radius: 999px;
}

.welcome::-webkit-scrollbar-thumb {
	background: var(--accent);
	border-radius: 999px;
	border: 2px solid var(--bg-elev-2);
}

.welcome::-webkit-scrollbar-thumb:hover {
	background: var(--accent-strong);
}

.ambient {
	position: absolute;
	pointer-events: none;
	border-radius: 999px;
	filter: blur(22px);
	opacity: var(--ambient-opacity, 0.35);
}

.ambient-a {
	width: 140px;
	height: 140px;
	right: -40px;
	top: -30px;
	background: rgba(34, 197, 94, 0.4);
}

.ambient-b {
	width: 120px;
	height: 120px;
	left: -40px;
	bottom: 20px;
	background: rgba(14, 165, 233, 0.35);
}

.hero {
	position: relative;
	z-index: 1;
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
	font-size: 18px;
	line-height: 1.2;
	letter-spacing: 0.01em;
}

.lead {
	margin: 8px 0 0;
	color: var(--muted);
	font-size: 12px;
	line-height: 1.55;
	max-width: 52ch;
}

.guide-grid {
	position: relative;
	z-index: 1;
	display: grid;
	gap: 10px;
}

.guide-card {
	background: var(--bg-elev-2);
	border: 1px solid var(--border);
	border-radius: 10px;
	padding: 10px;
	box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
}

.guide-card h2 {
	margin: 0;
	color: var(--accent);
	font-size: 12px;
	letter-spacing: 0.02em;
}

.guide-card p {
	margin: 5px 0 8px;
	color: var(--muted);
	font-size: 11px;
	line-height: 1.45;
}

.guide-card code {
	display: block;
	color: var(--text);
	font-size: 11px;
	line-height: 1.4;
	overflow-wrap: anywhere;
	font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
	background: var(--bg);
	border: 1px dashed var(--border);
	border-radius: 8px;
	padding: 8px;
}

.tips {
	position: relative;
	z-index: 1;
	display: grid;
	gap: 6px;
	align-content: end;
}

.tip {
	color: var(--accent);
	background: var(--tip-bg, rgba(20, 83, 45, 0.25));
	border: 1px solid var(--tip-border, rgba(34, 197, 94, 0.25));
	border-radius: 8px;
	padding: 7px 9px;
	font-size: 11px;
	line-height: 1.35;
}

.history-btn {
	appearance: none;
	border: 1px solid rgba(34, 197, 94, 0.38);
	background: rgba(15, 23, 42, 0.65);
	color: #bbf7d0;
	border-radius: 8px;
	padding: 8px 10px;
	font-size: 11px;
	font-weight: 700;
	cursor: pointer;
	transition: transform 120ms ease, background 160ms ease, color 160ms ease;
}

.history-btn:hover {
	transform: translateY(-1px);
	background: rgba(22, 163, 74, 0.18);
	color: #ecfdf5;
}

.history-btn:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

@media (max-width: 680px) {
	.welcome {
		padding: 14px;
		gap: 12px;
	}

	.hero h1 {
		font-size: 16px;
	}
}
</style>
