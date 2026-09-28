// Content script: detects "/command" typed into any text field on the page,
// shows a matching-snippet dropdown, and inserts the resolved snippet text.
// Self-contained on purpose (no imports) so it stays a valid classic script.

(function () {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  if (window.__dynamicSnippetsSlashCommandsInstalled) return;
  window.__dynamicSnippetsSlashCommandsInstalled = true;

  const SNIPPETS_KEY = 'snippets';
  const FOLDERS_KEY = 'snippetsFolders';
  const GLOBAL_VARS_KEY = 'globalVariables';
  const VARIABLE_MODAL_REQUEST = 'dynamic-snippets:request-variable-modal';
  const VARIABLE_MODAL_DISPLAY = 'dynamic-snippets:show-variable-modal';
  const QUERY_REGEX = /(?:^|\s)\/([a-zA-Z0-9_-]{0,30})$/;
  const VARIABLE_TOKEN_REGEX = /\$\{\{?[a-zA-Z0-9_-]+-(dropdown|input|text|date)\b/;

  let commandIndex = [];
  let activeDropdown = null;
  let contextInvalidated = false;

  function isExtensionContextValid() {
    if (contextInvalidated) return false;
    try {
      return Boolean(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  function markContextInvalidated() {
    contextInvalidated = true;
    closeDropdown();
  }

  function flattenCommands(items, acc) {
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      if (item.type === 'snippet' && item.command) {
        acc.push({
          id: item.id,
          name: item.name || 'Untitled Snippet',
          command: String(item.command).toLowerCase(),
          content: item.content || ''
        });
      }
      if (item.type === 'folder' && Array.isArray(item.children)) {
        flattenCommands(item.children, acc);
      }
    }
    return acc;
  }

  async function refreshCommandIndex() {
    if (!isExtensionContextValid()) return;
    try {
      const result = await chrome.storage.local.get([SNIPPETS_KEY, FOLDERS_KEY]);
      const snippets = Array.isArray(result[SNIPPETS_KEY]) ? result[SNIPPETS_KEY] : [];
      const folders = Array.isArray(result[FOLDERS_KEY]) ? result[FOLDERS_KEY] : [];
      commandIndex = flattenCommands([...snippets, ...folders], []);
    } catch (error) {
      if (String(error?.message).includes('Extension context invalidated')) {
        markContextInvalidated();
        return;
      }
      console.error('[DynamicSnippets] Failed to refresh command index:', error);
    }
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes[SNIPPETS_KEY] || changes[FOLDERS_KEY]) refreshCommandIndex();
    });
  } catch {
    markContextInvalidated();
  }

  refreshCommandIndex();

  async function getGlobalVariables() {
    if (!isExtensionContextValid()) return {};
    try {
      const result = await chrome.storage.local.get(GLOBAL_VARS_KEY);
      const data = result[GLOBAL_VARS_KEY];
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
      return { ...data };
    } catch (error) {
      if (String(error?.message).includes('Extension context invalidated')) {
        markContextInvalidated();
      }
      return {};
    }
  }

  function resolveGlobalVariablesInText(rawText, globalVariables) {
    if (typeof rawText !== 'string' || !rawText.includes('-global}')) return rawText;
    return rawText.replace(/\$\{([a-zA-Z0-9_-]+)-global\}/g, (_match, key) => {
      if (!Object.prototype.hasOwnProperty.call(globalVariables, key)) return 'undefined';
      const value = globalVariables[key];
      return value == null ? 'undefined' : String(value);
    });
  }

  function hasVariableTokens(text) {
    return typeof text === 'string' && VARIABLE_TOKEN_REGEX.test(text);
  }

  function isTextField(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') return /^(text|search|url|tel)$/i.test(el.type || 'text');
    return false;
  }

  function eventOriginTarget(event) {
    if (typeof event.composedPath === 'function') {
      const path = event.composedPath();
      if (path.length) return path[0];
    }
    return event.target;
  }

  function isEditableTarget(el) {
    return isTextField(el) || Boolean(el && el.isContentEditable);
  }

  function getTextFieldQuery(el) {
    const value = el.value || '';
    const caret = el.selectionStart ?? value.length;
    const match = QUERY_REGEX.exec(value.slice(0, caret));
    if (!match) return null;
    return { query: match[1], start: caret - match[1].length - 1, end: caret };
  }

  function getContentEditableQuery(el) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!range.collapsed || !el.contains(range.endContainer)) return null;
    const preRange = range.cloneRange();
    preRange.selectNodeContents(el);
    preRange.setEnd(range.endContainer, range.endOffset);
    const before = preRange.toString();
    const match = QUERY_REGEX.exec(before);
    if (!match) return null;
    return { query: match[1], matchLength: match[1].length + 1 };
  }

  // ── Variable-fill modal (mirrors background/variableResolver.js UI) ──
  function parseVariables(rawText) {
    const variables = [];

    const dropdownRegex = /\$\{\{([a-zA-Z0-9_-]+)-dropdown\|([^}]*)\}/g;
    let dropdownMatch;
    while ((dropdownMatch = dropdownRegex.exec(rawText)) !== null) {
      const token = dropdownMatch[0];
      const key = dropdownMatch[1];
      const options = dropdownMatch[2].split(',').map((opt) => opt.trim()).filter(Boolean);
      if (!options.length) continue;
      if (variables.some((v) => v.token === token)) continue;
      variables.push({ token, key, type: 'dropdown', value: options[0], options });
    }

    const inputRegex = /\$\{([a-zA-Z0-9_-]+)-input(?:\|([^}]*))?\}/g;
    let inputMatch;
    while ((inputMatch = inputRegex.exec(rawText)) !== null) {
      const token = inputMatch[0];
      const key = inputMatch[1];
      const defaultValue = inputMatch[2] || '';
      if (variables.some((v) => v.token === token)) continue;
      variables.push({ token, key, type: 'text', value: defaultValue, defaultValue });
    }

    const typedInputRegex = /\$\{\{?([a-zA-Z0-9_-]+)-(text|date)(?:\|([^}]*))?\}/g;
    let typedInputMatch;
    while ((typedInputMatch = typedInputRegex.exec(rawText)) !== null) {
      const token = typedInputMatch[0];
      const key = typedInputMatch[1];
      const type = typedInputMatch[2];
      const defaultValue = typedInputMatch[3] || '';
      if (variables.some((v) => v.token === token)) continue;
      variables.push({ token, key, type, value: defaultValue, defaultValue });
    }

    return variables;
  }

  function formatDateForLocale(value) {
    if (typeof value !== 'string') return value ?? '';
    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) return trimmed;
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isNaN(parsed.getTime())) return trimmed;
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed);
  }

  function resolveSnippetTemplate(rawText, variables) {
    let resolved = rawText;
    for (const variable of variables) {
      let safeReplacement = variable.value ?? '';
      if (variable.type === 'date') safeReplacement = formatDateForLocale(String(safeReplacement));
      resolved = resolved.split(variable.token).join(safeReplacement);
    }
    return resolved;
  }

  async function openVariableModal(rawText, variables) {
    return new Promise((resolve) => {
      const host = document.createElement('div');
      host.setAttribute('data-dynamic-snippets-modal', 'true');
      host.style.all = 'initial';
      host.style.position = 'fixed';
      host.style.inset = '0';
      host.style.zIndex = '2147483647';

      const shadowRoot = host.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host, * {
          box-sizing: border-box;
        }

        .ds-dialog {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          overflow: visible;
        }

        .ds-dialog::backdrop {
          background: transparent;
        }

        .ds-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          background: rgba(2, 6, 23, 0.62);
          backdrop-filter: blur(4px);
          display: grid;
          place-items: center;
          padding: 16px;
          font-family: Segoe UI, Inter, system-ui, -apple-system, sans-serif;
          color: #e5e7eb;
          color-scheme: dark;
        }

        .ds-modal {
          width: min(640px, 100%);
          max-height: calc(100dvh - 32px);
          display: flex;
          flex-direction: column;
          background: linear-gradient(170deg, #111827 0%, #0f172a 48%, #111827 100%);
          border: 1px solid #25314a;
          border-radius: 12px;
          box-shadow: 0 28px 60px rgba(2, 6, 23, 0.5);
          overflow: hidden;
        }

        .ds-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid #25314a;
        }

        .ds-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #e5e7eb;
        }

        .ds-close {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }

        .ds-body {
          padding: 14px;
          display: grid;
          gap: 10px;
          overflow-y: auto;
          min-height: 0;
        }

        .ds-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid #25314a;
        }

        .ds-field {
          display: grid;
          gap: 6px;
        }

        .ds-caption {
          color: #9ca3af;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .ds-input {
          width: 100%;
          border: 1px solid #25314a;
          background: rgba(15, 23, 42, 0.75);
          color: #e5e7eb;
          border-radius: 8px;
          padding: 9px 10px;
          outline: none;
          font-size: 12px;
        }

        .ds-input--date {
          border-color: #25314a;
          background: rgba(15, 23, 42, 0.75);
          color-scheme: dark;
          accent-color: #22c55e;
          caret-color: #e5e7eb;
          font-weight: 600;
          letter-spacing: 0;
          padding-right: 42px;
          appearance: none;
          -webkit-appearance: none;
        }

        .ds-input--date::-webkit-datetime-edit,
        .ds-input--date::-webkit-datetime-edit-text,
        .ds-input--date::-webkit-datetime-edit-day-field,
        .ds-input--date::-webkit-datetime-edit-month-field,
        .ds-input--date::-webkit-datetime-edit-year-field {
          color: #e5e7eb;
        }

        .ds-input--date::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1);
          opacity: 1;
          margin-left: auto;
          padding: 0;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .ds-input--date::-webkit-calendar-picker-indicator:hover {
          filter: brightness(0) invert(1);
          opacity: 0.9;
        }

        .ds-preview {
          margin: 0;
          padding: 10px;
          border-radius: 8px;
          border: 1px dashed #2b445f;
          background: rgba(8, 47, 73, 0.3);
          color: #7dd3fc;
          font-family: Cascadia Code, Fira Code, Consolas, monospace;
          font-size: 12px;
          line-height: 1.45;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .ds-btn {
          border-radius: 8px;
          padding: 7px 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }

        .ds-btn-cancel {
          border: 1px solid #25314a;
          background: #172033;
          color: #e5e7eb;
        }

        .ds-btn-insert {
          border: 1px solid transparent;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #ecfdf5;
        }
      `;

      const dialog = document.createElement('dialog');
      dialog.className = 'ds-dialog';

      const overlay = document.createElement('div');
      overlay.className = 'ds-overlay';

      const modal = document.createElement('section');
      modal.className = 'ds-modal';

      const header = document.createElement('div');
      header.className = 'ds-header';

      const title = document.createElement('h3');
      title.className = 'ds-title';
      title.textContent = 'Fill Snippet Variables';

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'ds-close';
      closeButton.textContent = 'x';

      const body = document.createElement('div');
      body.className = 'ds-body';

      const footer = document.createElement('div');
      footer.className = 'ds-footer';

      function createFieldLabel(textContent) {
        const label = document.createElement('label');
        label.className = 'ds-field';

        const caption = document.createElement('span');
        caption.className = 'ds-caption';
        caption.textContent = textContent;

        label.appendChild(caption);
        return label;
      }

      function styleInputElement(el, type = '') {
        el.className = type === 'date' ? 'ds-input ds-input--date' : 'ds-input';
      }

      const rows = [];
      let firstInput = null;

      for (const variable of variables) {
        const rowLabel = createFieldLabel(`${variable.key} (${variable.type})`);
        let input;

        if (variable.type === 'dropdown') {
          input = document.createElement('select');
          for (const optionValue of variable.options) {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            input.appendChild(option);
          }
          input.value = variable.value;
        } else {
          input = document.createElement('input');
          input.type = variable.type === 'date' ? 'date' : 'text';
          input.value = variable.defaultValue;
          input.placeholder = variable.type === 'date' ? 'YYYY-MM-DD' : 'Enter value';
        }

        styleInputElement(input, variable.type);
        rowLabel.appendChild(input);
        body.appendChild(rowLabel);
        rows.push({ variable, input });
        if (!firstInput) firstInput = input;
      }

      const previewLabel = createFieldLabel('Preview');
      const preview = document.createElement('pre');
      preview.className = 'ds-preview';
      previewLabel.appendChild(preview);
      body.appendChild(previewLabel);

      function renderPreview() {
        for (const row of rows) {
          row.variable.value = row.input.value;
        }
        preview.textContent = resolveSnippetTemplate(rawText, variables);
      }

      for (const row of rows) {
        row.input.addEventListener('input', renderPreview);
        row.input.addEventListener('change', renderPreview);
      }

      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.textContent = 'Cancel';
      cancelButton.className = 'ds-btn ds-btn-cancel';

      const insertButton = document.createElement('button');
      insertButton.type = 'button';
      insertButton.textContent = 'Insert';
      insertButton.className = 'ds-btn ds-btn-insert';

      function cleanup(result) {
        document.removeEventListener('keydown', onKeyDown, true);
        host.remove();
        resolve(result);
      }

      function onDialogCancel(event) {
        event.preventDefault();
        cleanup(null);
      }

      function onKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          cleanup(null);
        }
      }

      overlay.addEventListener('mousedown', (event) => {
        event.stopPropagation();
        if (event.target === overlay) cleanup(null);
      });
      modal.addEventListener('mousedown', (event) => event.stopPropagation());
      closeButton.addEventListener('click', () => cleanup(null));
      cancelButton.addEventListener('click', () => cleanup(null));
      insertButton.addEventListener('click', () => {
        for (const row of rows) {
          row.variable.value = row.input.value;
        }
        cleanup(resolveSnippetTemplate(rawText, variables));
      });

      document.addEventListener('keydown', onKeyDown, true);
      dialog.addEventListener('cancel', onDialogCancel);

      header.appendChild(title);
      header.appendChild(closeButton);
      footer.appendChild(cancelButton);
      footer.appendChild(insertButton);
      modal.appendChild(header);
      modal.appendChild(body);
      modal.appendChild(footer);
      overlay.appendChild(modal);
      shadowRoot.appendChild(style);
      dialog.appendChild(overlay);
      shadowRoot.appendChild(dialog);
      document.documentElement.appendChild(host);
      dialog.showModal();

      renderPreview();
      if (firstInput) firstInput.focus();
    });
  }

  function resolveVariablesInteractive(text) {
    const variables = parseVariables(text);
    if (!variables.length) return Promise.resolve(text);
    if (window === window.top) return openVariableModal(text, variables);

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({
          type: VARIABLE_MODAL_REQUEST,
          rawText: text,
          variables
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(null);
            return;
          }
          resolve(typeof response?.result === 'string' ? response.result : null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  if (window === window.top) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== VARIABLE_MODAL_DISPLAY || typeof message.rawText !== 'string' || !Array.isArray(message.variables)) return;
      openVariableModal(message.rawText, message.variables)
        .then((result) => sendResponse({ result }))
        .catch(() => sendResponse({ result: null }));
      return true;
    });
  }

  // ── Slash-command dropdown UI ──
  function closeDropdown() {
    if (!activeDropdown) return;
    activeDropdown.host.remove();
    window.removeEventListener('scroll', activeDropdown.reposition, true);
    window.removeEventListener('resize', activeDropdown.reposition);
    activeDropdown = null;
  }

  function createDropdown(el, matches, context) {
    const host = document.createElement('div');
    host.setAttribute('data-dynamic-snippets-slash-menu', 'true');
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';

    const shadowRoot = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host, * { box-sizing: border-box; }
      .ds-panel { min-width: 220px; max-width: 320px; max-height: 240px; overflow-y: auto; background: #111827; border: 1px solid #25314a; border-radius: 8px; box-shadow: 0 16px 40px rgba(2,6,23,0.5); font-family: Segoe UI, Inter, system-ui, -apple-system, sans-serif; padding: 4px; }
      .ds-item { display: flex; flex-direction: column; gap: 1px; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
      .ds-item--active { background: #1f2937; }
      .ds-item-name { color: #e5e7eb; font-size: 12px; font-weight: 600; }
      .ds-item-command { color: #7dd3fc; font-size: 11px; font-family: Cascadia Code, Fira Code, Consolas, monospace; }
    `;

    const panel = document.createElement('div');
    panel.className = 'ds-panel';

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(panel);
    (document.body).appendChild(host);

    activeDropdown = {
      host,
      panel,
      field: el,
      items: matches,
      highlighted: 0,
      context,
      reposition: () => positionDropdown(el)
    };

    renderDropdownItems();
    positionDropdown(el);

    window.addEventListener('scroll', activeDropdown.reposition, true);
    window.addEventListener('resize', activeDropdown.reposition);
  }

  function renderDropdownItems() {
    if (!activeDropdown) return;
    const { panel, items, highlighted } = activeDropdown;
    panel.innerHTML = '';
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'ds-item' + (index === highlighted ? ' ds-item--active' : '');
      const name = document.createElement('span');
      name.className = 'ds-item-name';
      name.textContent = item.name;
      const command = document.createElement('span');
      command.className = 'ds-item-command';
      command.textContent = `/${item.command}`;
      row.appendChild(name);
      row.appendChild(command);
      row.addEventListener('mousedown', (event) => {
        event.preventDefault();
        confirmSelection(activeDropdown.field, activeDropdown.context, item);
      });
      panel.appendChild(row);
    });
  }

  function moveHighlight(delta) {
    if (!activeDropdown) return;
    const count = activeDropdown.items.length;
    activeDropdown.highlighted = (activeDropdown.highlighted + delta + count) % count;
    renderDropdownItems();
  }

  function confirmHighlighted() {
    if (!activeDropdown) return;
    const item = activeDropdown.items[activeDropdown.highlighted];
    confirmSelection(activeDropdown.field, activeDropdown.context, item);
  }

  function positionDropdown(el) {
    if (!activeDropdown) return;
    const rect = el.getBoundingClientRect();
    const panelRect = activeDropdown.panel.getBoundingClientRect();
    let top = rect.bottom + 4;
    if (top + panelRect.height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - panelRect.height - 4);
    }
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelRect.width - 8);
    activeDropdown.host.style.top = `${top}px`;
    activeDropdown.host.style.left = `${left}px`;
  }

  async function confirmSelection(el, context, item) {
    closeDropdown();

    let insertionStart = null;
    if (isTextField(el)) {
      const value = el.value;
      insertionStart = context.start;
      el.value = value.slice(0, context.start) + value.slice(context.end);
      el.selectionStart = insertionStart;
      el.selectionEnd = insertionStart;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      el.focus();
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      for (let i = 0; i < context.matchLength; i += 1) {
        selection.modify('extend', 'backward', 'character');
      }
      const deleteRange = selection.getRangeAt(0);
      deleteRange.deleteContents();
      selection.removeAllRanges();
      selection.addRange(deleteRange);
    }

    const globals = await getGlobalVariables();
    let text = resolveGlobalVariablesInText(item.content, globals);
    if (hasVariableTokens(text)) {
      const result = await resolveVariablesInteractive(text);
      if (result == null) return;
      text = result;
    }

    if (isTextField(el)) {
      el.focus();
      const before = el.value.slice(0, insertionStart);
      const after = el.value.slice(insertionStart);
      el.value = before + text + after;
      const caret = insertionStart + text.length;
      el.selectionStart = caret;
      el.selectionEnd = caret;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.focus();
      const inserted = document.execCommand('insertText', false, text);
      if (!inserted) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }

  function handleFieldInput(el) {
    if (!isExtensionContextValid() || !commandIndex.length) {
      closeDropdown();
      return;
    }

    const context = isTextField(el) ? getTextFieldQuery(el) : getContentEditableQuery(el);
    if (!context || !context.query.length) {
      closeDropdown();
      return;
    }

    const query = context.query.toLowerCase();
    const matches = commandIndex.filter((c) => c.command.startsWith(query)).slice(0, 8);
    if (!matches.length) {
      closeDropdown();
      return;
    }

    if (activeDropdown && activeDropdown.field === el) {
      activeDropdown.items = matches;
      activeDropdown.highlighted = 0;
      activeDropdown.context = context;
      renderDropdownItems();
      positionDropdown(el);
    } else {
      closeDropdown();
      createDropdown(el, matches, context);
    }
  }

  document.addEventListener('input', (event) => {
    const el = eventOriginTarget(event);
    if (!isEditableTarget(el)) return;
    handleFieldInput(el);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!activeDropdown) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      moveHighlight(event.shiftKey ? -1 : 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      confirmHighlighted();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
    }
  }, true);

  document.addEventListener('mousedown', (event) => {
    if (!activeDropdown) return;
    const target = eventOriginTarget(event);
    if (target === activeDropdown.field) return;
    if (activeDropdown.host.contains(target)) return;
    closeDropdown();
  }, true);

  document.addEventListener('focusout', (event) => {
    if (!activeDropdown) return;
    const target = eventOriginTarget(event);
    if (target !== activeDropdown.field) return;
    setTimeout(() => {
      if (activeDropdown && activeDropdown.field === target && document.activeElement !== target) {
        closeDropdown();
      }
    }, 150);
  }, true);
})();
