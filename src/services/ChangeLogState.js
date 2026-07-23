import storage from './Storage';

const SEEN_CHANGELOG_VERSION_KEY = 'ds_seen_changelog_version';

async function getSeenVersion() {
  try {
    const result = await storage.getLocal(SEEN_CHANGELOG_VERSION_KEY);
    return typeof result?.[SEEN_CHANGELOG_VERSION_KEY] === 'string'
      ? result[SEEN_CHANGELOG_VERSION_KEY]
      : null;
  } catch {
    return null;
  }
}

async function setSeenVersion(version) {
  if (!version || typeof version !== 'string') return;
  try {
    await storage.setLocal({ [SEEN_CHANGELOG_VERSION_KEY]: version });
  } catch {
    // Ignore storage failures so UI can continue.
  }
}

export default {
  getSeenVersion,
  setSeenVersion
};
