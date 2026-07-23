export const VARIABLE_TYPE_OPTIONS = [
  { value: 'dropdown', label: 'Dropdown with options' },
  { value: 'text', label: 'Text input' },
  { value: 'date', label: 'Date input' }
];

export function normalizeVariableType(type) {
  if (type === 'input') return 'text';
  return type;
}

export function parseCsvOptions(rawValue = '') {
  return String(rawValue)
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

export function buildVariableToken({
  type,
  key,
  options = '',
  defaultValue = ''
}) {
  const normalizedType = normalizeVariableType(type);
  const normalizedKey = String(key || '').trim();

  if (!normalizedKey) return '';

  if (normalizedType === 'dropdown') {
    const csvOptions = Array.isArray(options) ? options.join(',') : String(options || '').trim();
    return `\${{${normalizedKey}-dropdown|${csvOptions}}`;
  }

  if (normalizedType === 'date') {
    return `\${${normalizedKey}-date|${String(defaultValue || '').trim()}}`;
  }

  return `\${${normalizedKey}-text|${String(defaultValue || '').trim()}}`;
}
