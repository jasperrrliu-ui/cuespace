const MEMORY_KEY = 'cuespace-memory-v1';

const emptyMemory = () => ({
  version: 1,
  user: { confirmedPreferences: [] },
  projects: {},
  scenes: {}
});

function read(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(MEMORY_KEY));
    return parsed && parsed.version === 1 ? parsed : emptyMemory();
  } catch {
    return emptyMemory();
  }
}

function write(storage, memory) {
  storage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

function boundedPush(list, item, limit = 12) {
  list.unshift(item);
  list.splice(limit);
}

export function createMemoryStore(storage = globalThis.localStorage) {
  const memory = read(storage);
  const save = () => write(storage, memory);

  return {
    context({ projectId = 'default-project', sceneId = 'demo-scene' } = {}) {
      return {
        user: memory.user,
        project: memory.projects[projectId] ?? { notes: [] },
        scene: memory.scenes[sceneId] ?? { notes: [], openQuestions: [] }
      };
    },
    recordSceneNote(sceneId, note) {
      const scene = memory.scenes[sceneId] ??= { notes: [], openQuestions: [] };
      boundedPush(scene.notes, { text: note, status: 'temporary', createdAt: new Date().toISOString() });
      save();
    },
    proposePreference(text) {
      return { scope: 'user', text, status: 'inferred', requiresConfirmation: true };
    },
    confirmPreference(text) {
      boundedPush(memory.user.confirmedPreferences, { text, status: 'confirmed', createdAt: new Date().toISOString() });
      save();
    },
    snapshot() {
      return JSON.parse(JSON.stringify(memory));
    }
  };
}

export { MEMORY_KEY };
