import { normalizeVariableType, parseCsvOptions } from './typeRegistry.js';

const DROPDOWN_REGEX = /\$\{\{([a-zA-Z0-9_-]+)-dropdown\|([^}]*)\}/g;
const TYPED_INPUT_REGEX = /\$\{\{?([a-zA-Z0-9_-]+)-(input|text|date)(?:\|([^}]*))?\}/g;

export function parseVariableTokens(rawText) {
  if (typeof rawText !== 'string' || !rawText.includes('${')) return [];

  const variables = [];
  const seenTokens = new Set();

  let dropdownMatch;
  while ((dropdownMatch = DROPDOWN_REGEX.exec(rawText)) !== null) {
    const token = dropdownMatch[0];
    if (seenTokens.has(token)) continue;

    const key = dropdownMatch[1];
    const options = parseCsvOptions(dropdownMatch[2]);
    if (!options.length) continue;

    seenTokens.add(token);
    variables.push({
      token,
      key,
      type: 'dropdown',
      value: options[0],
      options
    });
  }

  let typedInputMatch;
  while ((typedInputMatch = TYPED_INPUT_REGEX.exec(rawText)) !== null) {
    const token = typedInputMatch[0];
    if (seenTokens.has(token)) continue;

    const key = typedInputMatch[1];
    const normalizedType = normalizeVariableType(typedInputMatch[2]);
    const defaultValue = typedInputMatch[3] || '';

    seenTokens.add(token);

    variables.push({
      token,
      key,
      type: normalizedType,
      value: defaultValue,
      defaultValue
    });
  }

  return variables;
}

export function hasVariableTokens(rawText) {
  return parseVariableTokens(rawText).length > 0;
}
