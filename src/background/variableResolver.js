export function resolveSnippetVariables(text) {
  function parseVariables(rawText) {
    const variables = [];

    const dropdownRegex = /\$\{\{([a-zA-Z0-9_-]+)-dropdown\|([^}]*)\}/g;
    let dropdownMatch;
    while ((dropdownMatch = dropdownRegex.exec(rawText)) !== null) {
      const token = dropdownMatch[0];
      const key = dropdownMatch[1];
      const options = dropdownMatch[2]
        .split(',')
        .map((opt) => opt.trim())
        .filter(Boolean);

      if (!options.length) continue;
      if (variables.some((v) => v.token === token)) continue;

      variables.push({
        token,
        key,
        type: 'dropdown',
        value: options[0],
        options
      });
    }

    const inputRegex = /\$\{([a-zA-Z0-9_-]+)-input(?:\|([^}]*))?\}/g;
    let inputMatch;
    while ((inputMatch = inputRegex.exec(rawText)) !== null) {
      const token = inputMatch[0];
      const key = inputMatch[1];
      const defaultValue = inputMatch[2] || '';

      if (variables.some((v) => v.token === token)) continue;

      variables.push({
        token,
        key,
        type: 'text',
        value: defaultValue,
        defaultValue
      });
    }

    const typedInputRegex = /\$\{\{?([a-zA-Z0-9_-]+)-(text|date)(?:\|([^}]*))?\}/g;
    let typedInputMatch;
    while ((typedInputMatch = typedInputRegex.exec(rawText)) !== null) {
      const token = typedInputMatch[0];
      const key = typedInputMatch[1];
      const type = typedInputMatch[2];
      const defaultValue = typedInputMatch[3] || '';

      if (variables.some((v) => v.token === token)) continue;

      variables.push({
        token,
        key,
        type,
        value: defaultValue,
        defaultValue
      });
    }

    return variables;
  }

  function formatDateForLocale(value) {
    if (typeof value !== 'string') return value ?? '';

    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) return trimmed;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);

    if (Number.isNaN(parsed.getTime())) return trimmed;

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(parsed);
  }

  function resolveSnippetTemplate(rawText, variables) {
    let resolved = rawText;
    for (const variable of variables) {
      let safeReplacement = variable.value ?? '';
      if (variable.type === 'date') {
        safeReplacement = formatDateForLocale(String(safeReplacement));
      }
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

      header.appendChild(title);
      header.appendChild(closeButton);
      footer.appendChild(cancelButton);
      footer.appendChild(insertButton);
      modal.appendChild(header);
      modal.appendChild(body);
      modal.appendChild(footer);
      overlay.appendChild(modal);
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(overlay);
      (document.body || document.documentElement).appendChild(host);

      renderPreview();
      if (firstInput) firstInput.focus();
    });
  }

  const variables = parseVariables(text);
  if (!variables.length) return Promise.resolve(text);
  return openVariableModal(text, variables);
}
