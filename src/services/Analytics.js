import { isAnalyticsEnabled } from './AnalyticsConsent.js';

const EVENTS_KEY = 'ds_analytics_events';
const MAX_EVENTS = 500;

export function track(action) {
  if (!isAnalyticsEnabled()) return;
  if (!action || typeof action !== 'string') return;

  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    events.push({ action, at: new Date().toISOString() });
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage errors — analytics should never block the app.
  }
}
