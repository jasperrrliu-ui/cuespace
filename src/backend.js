const API_BASE = 'http://127.0.0.1:8000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail ?? `Request failed (${response.status})`);
  return response.json();
}

export async function connectBackend() {
  await request('/health');
  const previousId = localStorage.getItem('cuespace-backend-scene-id');
  if (previousId) {
    try { return await request(`/scenes/${previousId}`); } catch { localStorage.removeItem('cuespace-backend-scene-id'); }
  }
  const record = await request('/scenes', { method: 'POST', body: JSON.stringify({ title: 'CueSpace stage study' }) });
  localStorage.setItem('cuespace-backend-scene-id', record.scene.sceneId);
  return record;
}

export function runAgent(sceneId, text, expectedVersion) {
  return request(`/scenes/${sceneId}/agent-runs`, { method: 'POST', body: JSON.stringify({ text, expected_version: expectedVersion }) });
}

export function saveSnapshot(sceneId, label) {
  return request(`/scenes/${sceneId}/versions`, { method: 'POST', body: JSON.stringify({ label }) });
}

export function saveScene(sceneId, scene, expectedVersion, note = 'Manual edit') {
  return request(`/scenes/${sceneId}`, { method: 'PATCH', body: JSON.stringify({ scene, expected_version: expectedVersion, note }) });
}
