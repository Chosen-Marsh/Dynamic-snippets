# Dynamic Snippets

Save, organize, and instantly paste reusable text snippets with dynamic variables. Boost your productivity with folders, templates, and one-click insertion.

## Features

- **Snippet Management** — Create and organize snippets in a hierarchical folder tree
- **Dynamic Variables** — Insert dropdown selectors (`${{key|opt1,opt2}}`) and text inputs (`${key|default}`) that prompt for values on paste
- **Context Menu Insertion** — Right-click any editable field to paste snippets, organized by folder
- **Variable Builder** — Visual modal to create variable tokens without memorizing syntax
- **Auto-Save** — Changes are debounced and saved automatically with a live status indicator
- **Built-in Templates** — Ships with starter snippets (bug reports, PR checklists, message templates)
- **Persistent Storage** — Syncs via Chrome storage API across sessions

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Load in Browser

1. **Chrome** — Navigate to `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select the `dist` folder.
2. **Edge** — Navigate to `edge://extensions`, enable Developer mode, click **Load unpacked**, and select the `dist` folder.

## Tech Stack

- Vue 3
- Vite
- Chrome Extension Manifest V3
