import storage from './Storage';

// Bump the suffix to show a reworked tour to everyone again.
const ONBOARDING_KEY = 'ds_onboarding_completed_v1';

async function isCompleted() {
  try {
    const result = await storage.getLocal(ONBOARDING_KEY);
    return Boolean(result?.[ONBOARDING_KEY]);
  } catch {
    return false;
  }
}

async function markCompleted() {
  try {
    await storage.setLocal({ [ONBOARDING_KEY]: new Date().toISOString() });
  } catch {
    // Ignore storage failures; worst case the tour shows again.
  }
}

export default {
  isCompleted,
  markCompleted
};
