const TRACE_KEY = 'cuespace-agent-traces-v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createAgentTelemetry(storage = globalThis.localStorage, limit = 80) {
  let events = [];
  try { events = JSON.parse(storage.getItem(TRACE_KEY)) ?? []; } catch { events = []; }

  function record(event) {
    events.unshift({ ...event, timestamp: new Date().toISOString() });
    events = events.slice(0, limit);
    storage.setItem(TRACE_KEY, JSON.stringify(events));
  }

  return {
    record,
    snapshot() { return clone(events); },
    clear() { events = []; storage.removeItem(TRACE_KEY); }
  };
}

export { TRACE_KEY };
