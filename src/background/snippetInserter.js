export async function insertSnippetText(text) {

  function showToast(message, type = 'info') {
    const existing = document.querySelector('[data-dynamic-snippets-toast-host="true"]');
    if (existing) existing.remove();

    const host = document.createElement('div');
    host.setAttribute('data-dynamic-snippets-toast-host', 'true');
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.right = '16px';
    host.style.bottom = '16px';
    host.style.zIndex = '2147483647';

    const shadowRoot = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .toast {
        max-width: 320px;
        border: 1px solid #25314a;
        background: linear-gradient(170deg, #111827 0%, #0f172a 48%, #111827 100%);
        color: #e5e7eb;
        font-family: Segoe UI, Inter, system-ui, -apple-system, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        padding: 10px 12px;
        box-shadow: 0 12px 28px rgba(2, 6, 23, 0.45);
      }

      .toast.success {
        border-color: rgba(34, 197, 94, 0.65);
      }

      .toast.error {
        border-color: rgba(239, 68, 68, 0.65);
      }
    `;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(toast);
    (document.body || document.documentElement).appendChild(host);

    window.setTimeout(() => host.remove(), 2600);
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
    showToast('Could not insert into this field. Snippet copied to clipboard.', 'success');
    return { inserted: false, copied: true };
  }

  showToast('Could not insert snippet and clipboard copy failed.', 'error');
  return { inserted: false, copied: false };
}
