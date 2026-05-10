export async function insertSnippetText(text) {

  function showToast(message, type = 'info') {
    const existing = document.querySelector(
      '[data-dynamic-snippets-toast-host="true"]'
    );

    if (existing) existing.remove();

    const host = document.createElement('div');

    host.setAttribute('data-dynamic-snippets-toast-host', 'true');
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.right = '20px';
    host.style.bottom = '20px';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';

    const shadowRoot = host.attachShadow({
      mode: 'closed'
    });

    const style = document.createElement('style');

    style.textContent = `
      :host, * {
        box-sizing: border-box;
      }

      .ds-toast {
        position: relative;

        width: 340px;
        display: flex;
        align-items: flex-start;
        gap: 12px;

        padding: 14px 16px 16px;

        border-radius: 18px;

        background:
          linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.96),
            rgba(17, 24, 39, 0.94)
          );

        border: 1px solid rgba(255,255,255,0.08);

        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);

        box-shadow:
          0 10px 30px rgba(0,0,0,0.35),
          inset 0 1px 0 rgba(255,255,255,0.06);

        color: #f3f4f6;

        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;

        pointer-events: auto;

        animation:
          ds-toast-in 220ms cubic-bezier(.2,.8,.2,1),
          ds-toast-out 220ms ease forwards 2.5s;
      }

      .ds-toast__icon {
        flex-shrink: 0;

        width: 22px;
        height: 22px;

        border-radius: 999px;

        display: flex;
        align-items: center;
        justify-content: center;

        font-size: 12px;
        font-weight: 700;

        margin-top: 1px;
      }

      .ds-toast__content {
        flex: 1;
        min-width: 0;
      }

      .ds-toast__title {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.2;

        margin: 0 0 4px;

        letter-spacing: 0.01em;

        color: #ffffff;
      }

      .ds-toast__message {
        margin: 0;

        font-size: 12px;
        line-height: 1.45;

        color: rgba(255,255,255,0.78);

        word-break: break-word;
      }

      .ds-toast__progress {
        position: absolute;

        left: 10px;
        right: 10px;
        bottom: 8px;

        height: 3px;

        overflow: hidden;
        border-radius: 999px;

        background: rgba(255,255,255,0.06);
      }

      .ds-toast__progress::after {
        content: '';

        display: block;

        width: 100%;
        height: 100%;

        transform-origin: left;

        animation: ds-toast-progress 2.5s linear forwards;
      }

      .ds-toast--success .ds-toast__icon {
        background: rgba(34,197,94,0.16);
        color: #4ade80;

        box-shadow:
          inset 0 0 0 1px rgba(74,222,128,0.22);
      }

      .ds-toast--success .ds-toast__progress::after {
        background:
          linear-gradient(
            90deg,
            #22c55e,
            #4ade80
          );
      }

      .ds-toast--error .ds-toast__icon {
        background: rgba(239,68,68,0.16);
        color: #f87171;

        box-shadow:
          inset 0 0 0 1px rgba(248,113,113,0.22);
      }

      .ds-toast--error .ds-toast__progress::after {
        background:
          linear-gradient(
            90deg,
            #ef4444,
            #f87171
          );
      }

      .ds-toast--info .ds-toast__icon {
        background: rgba(59,130,246,0.16);
        color: #60a5fa;

        box-shadow:
          inset 0 0 0 1px rgba(96,165,250,0.22);
      }

      .ds-toast--info .ds-toast__progress::after {
        background:
          linear-gradient(
            90deg,
            #3b82f6,
            #60a5fa
          );
      }

      @keyframes ds-toast-in {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.96);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes ds-toast-out {
        to {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
      }

      @keyframes ds-toast-progress {
        from {
          transform: scaleX(1);
        }

        to {
          transform: scaleX(0);
        }
      }
    `;

    const icons = {
      success: '✓',
      error: '✕',
      info: 'i'
    };

    const titles = {
      success: 'Success',
      error: 'Error',
      info: 'Notice'
    };

    const toast = document.createElement('div');

    toast.className = `ds-toast ds-toast--${type}`;

    toast.innerHTML = `
      <div class="ds-toast__icon">
        ${icons[type] || icons.info}
      </div>

      <div class="ds-toast__content">
        <div class="ds-toast__title">
          ${titles[type] || titles.info}
        </div>

        <div class="ds-toast__message">
          ${message}
        </div>
      </div>

      <div class="ds-toast__progress"></div>
    `;

    shadowRoot.append(style, toast);

    (document.body || document.documentElement).appendChild(host);

    window.setTimeout(() => {
      host.remove();
    }, 5000);
  }

  async function copyTextToClipboard(value) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (error) {
      // Fall through to execCommand fallback.
    }

    try {
      const temp = document.createElement('textarea');
      temp.value = value;
      temp.setAttribute('readonly', 'true');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      temp.style.pointerEvents = 'none';
      (document.body || document.documentElement).appendChild(temp);
      temp.focus();
      temp.select();
      temp.setSelectionRange(0, temp.value.length);
      const success = document.execCommand('copy');
      temp.remove();
      return Boolean(success);
    } catch (error) {
      return false;
    }
  }

  function tryInsertIntoActive(value) {
    const active = getDeepActiveElement();
    if (!active) return false;

    if (
      active.tagName === 'TEXTAREA' ||
      (active.tagName === 'INPUT' && /^(text|search|url|tel|password|email)$/i.test(active.type || 'text'))
    ) {
      if (typeof active.focus === 'function') active.focus();
      const start = active.selectionStart ?? active.value.length;
      const end = active.selectionEnd ?? start;
      const currentValue = active.value || '';
      active.value = currentValue.slice(0, start) + value + currentValue.slice(end);
      const caret = start + value.length;
      active.selectionStart = caret;
      active.selectionEnd = caret;
      active.dispatchEvent(new Event('input', { bubbles: true }));
      active.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (active.isContentEditable) {
      if (typeof active.focus === 'function') active.focus();
      const inserted = document.execCommand('insertText', false, value);
      if (inserted) return true;

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return false;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(value));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    }

    return false;
  }

  function getDeepActiveElement(doc = document) {
    let active = doc.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    return active;
  }

  if (tryInsertIntoActive(text)) {
    return { inserted: true, copied: false };
  }

  const copied = await copyTextToClipboard(text);
  if (copied) {
    showToast('Could not insert Snippet. Text copied to clipboard.', 'error');
    return { inserted: false, copied: true };
  }

  showToast('Could not insert snippet and clipboard copy failed.', 'error');
  return { inserted: false, copied: false };
}