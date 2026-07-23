import v1_1_0 from './v1_1_0.js';

const CHANGELOGS = {
  '1.1.0': v1_1_0
};

function compareSemverDesc(a, b) {
  const aParts = String(a).split('.').map((part) => Number(part) || 0);
  const bParts = String(b).split('.').map((part) => Number(part) || 0);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aValue = aParts[index] || 0;
    const bValue = bParts[index] || 0;
    if (aValue !== bValue) return bValue - aValue;
  }

  return 0;
}

export function getChangelogByVersion(version) {
  if (!version) return null;
  return CHANGELOGS[version] || null;
}

export function getAllChangelogs() {
  return Object.values(CHANGELOGS).sort((first, second) =>
    compareSemverDesc(first.version, second.version)
  );
}

export { CHANGELOGS };
