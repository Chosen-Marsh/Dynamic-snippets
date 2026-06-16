const MISSING_GLOBAL_VALUE = 'undefined';
const GLOBAL_VAR_REGEX = /\$\{([a-zA-Z0-9_-]+)-global\}/g;

export function resolveGlobalVariablesInText(rawText, globalVariables = {}) {
  if (typeof rawText !== 'string' || !rawText.includes('-global}')) {
    return rawText;
  }

  return rawText.replace(GLOBAL_VAR_REGEX, (_match, key) => {
    if (!Object.prototype.hasOwnProperty.call(globalVariables, key)) {
      return MISSING_GLOBAL_VALUE;
    }
    const value = globalVariables[key];
    return value == null ? MISSING_GLOBAL_VALUE : String(value);
  });
}
