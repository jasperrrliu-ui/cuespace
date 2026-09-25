import { createDefaultScene, cloneScene, applyPatch } from './scene.js?v=lighting-model-3';
import { renderScene } from './renderer.js?v=lighting-model-3';
import { planFromText } from './planner.js?v=lighting-model-3';
import { createCueSpaceAgent } from './agent/harness.js?v=agent-backbone-1';
import { createTwoPassDeterministicGateway } from './agent/gateway.js?v=agent-backbone-2';
import { createMemoryStore } from './agent/memory.js?v=agent-backbone-1';
import { createAgentTelemetry } from './agent/observability.js?v=agent-backbone-1';
import { connectBackend, runAgent, saveSnapshot, saveScene } from './backend.js?v=backend-2';

const STORAGE_KEY = 'cuespace-scene-v1';
const VERSION_KEY = 'cuespace-versions-v1';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div>
          <p class="eyebrow">Stage 1 demo / agent backbone</p>
        <h1>CueSpace</h1>
        <p class="subtitle">Explore a stage idea, then shape the light yourself.</p>
      </div>
        <div class="status" id="connection-status"><span class="status-dot"></span>Connecting backend…</div>
    </header>

    <section class="workspace">
      <aside class="panel input-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">01 / describe</p>
            <h2>Start with an idea</h2>
          </div>
          <span class="tag">text</span>
        </div>
        <textarea id="prompt" placeholder="No special format needed. Mention the place, people or lifestyle, objects, palette, light, and what to avoid.">A small black-box stage with an old wooden table, a back scrim, and a quiet moonlit mood.</textarea>
        <button class="primary" id="apply-prompt">Update stage</button>
        <p class="helper">Agent backbone is active. The current gateway is a deterministic local fallback; a model can be added without changing the SceneGraph contract.</p>
        <div class="assumptions" id="assumptions"></div>
        <div class="agent-meta" id="agent-meta"></div>
        <div class="intent-summary" id="intent-summary"></div>
      </aside>

      <div class="compose-review">
        <section class="stage-panel">
          <div class="stage-toolbar">
            <div>
              <p class="eyebrow">03 / compose</p>
              <h2>Interactive stage</h2>
            </div>
            <p class="stage-hint">Drag furniture to reposition it.</p>
          </div>
          <div class="stage-wrap" id="stage-wrap"></div>
          <div class="scene-meta"><span id="scene-summary"></span><span id="selected-summary">Select an object</span></div>
        </section>

        <aside class="panel controls-panel">
          <div class="panel-heading compact">
            <div>
              <p class="eyebrow">02 / revise</p>
              <h2>Lighting controls</h2>
            </div>
          </div>
          <div class="light-rig" id="light-rig"></div>
          <label class="control-row">Selected light <select id="light-select"></select></label>
          <p class="light-role" id="light-role"></p>
          <label class="control-row">Color <input id="light-color" type="color" value="#6e8cff" /></label>
          <label class="control-row">Intensity <input id="light-intensity" type="range" min="0" max="1" step="0.01" value="0.65" /><output id="intensity-value">65%</output></label>
          <label class="control-row">Color influence <input id="light-color-mix" type="range" min="0" max="1" step="0.01" value="0.35" /><output id="color-mix-value">35%</output></label>
          <label class="control-row">Softness <input id="light-softness" type="range" min="0" max="1" step="0.01" value="0.5" /><output id="softness-value">50%</output></label>
          <label class="control-row">Gobo / pattern <select id="light-gobo"><option value="none">None</option><option value="window">Window breakup</option><option value="venetian">Venetian blinds</option><option value="stars">Star field</option></select></label>
          <label class="control-row">Focus target <select id="light-target"></select></label>
          <button class="secondary" id="reset-scene">Reset scene</button>
        </aside>
      </div>

      <aside class="panel history-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">04 / remember</p>
            <h2>Versions</h2>
          </div>
          <span class="tag">local</span>
        </div>
        <button class="primary" id="save-version">Save version</button>
        <div id="versions" class="versions"></div>
        <div class="divider"></div>
        <p class="eyebrow">Scene state</p>
        <pre id="scene-json" class="scene-json"></pre>
      </aside>
    </section>
  </main>
`;

let scene = normalizeScene(loadScene() ?? createDefaultScene());
let versions = loadVersions();
let selectedObjectId = null;
let backendSceneId = null;
let manualSyncTimer = null;
const memoryStore = createMemoryStore();
const telemetry = createAgentTelemetry();
const agent = createCueSpaceAgent({
  gateway: createTwoPassDeterministicGateway({ planner: planFromText }),
  memoryStore,
  telemetry,
  policy: { maxTurns: 1, maxClarifications: 1, timeoutMs: 8000 }
});

const stageWrap = document.querySelector('#stage-wrap');
const prompt = document.querySelector('#prompt');
const assumptions = document.querySelector('#assumptions');
const agentMeta = document.querySelector('#agent-meta');
const intentSummary = document.querySelector('#intent-summary');
const sceneSummary = document.querySelector('#scene-summary');
const selectedSummary = document.querySelector('#selected-summary');
const sceneJson = document.querySelector('#scene-json');
const lightSelect = document.querySelector('#light-select');
const lightColor = document.querySelector('#light-color');
const lightIntensity = document.querySelector('#light-intensity');
const intensityValue = document.querySelector('#intensity-value');
const lightColorMix = document.querySelector('#light-color-mix');
const colorMixValue = document.querySelector('#color-mix-value');
const lightSoftness = document.querySelector('#light-softness');
const softnessValue = document.querySelector('#softness-value');
const lightGobo = document.querySelector('#light-gobo');
const lightTarget = document.querySelector('#light-target');

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
  localStorage.setItem(VERSION_KEY, JSON.stringify(versions));
}

function refresh() {
  stageWrap.innerHTML = renderScene(scene);
  bindStageEvents();
  refreshLightControls();
  sceneSummary.textContent = `${scene.objects.length} objects · ${scene.lights.length} lights · version ${scene.version}`;
  selectedSummary.textContent = selectedObjectId ? `Selected: ${selectedObjectId}` : 'Drag a set piece to edit it';
  sceneJson.textContent = JSON.stringify(scene, null, 2);
  renderVersions();
  persist();
}

function refreshLightControls() {
  const selectedId = lightSelect.value;
  lightSelect.innerHTML = scene.lights.map((light) => `<option value="${light.id}">${light.label}</option>`).join('');
  lightSelect.value = scene.lights.some((item) => item.id === selectedId) ? selectedId : scene.lights[0]?.id;
  const light = scene.lights.find((item) => item.id === lightSelect.value) ?? scene.lights[0];
  if (!light) return;
  document.querySelector('#light-rig').innerHTML = scene.lights.map((item) => `
    <button class="light-chip ${item.id === light.id ? 'active' : ''}" data-light-id="${item.id}">
      <span class="light-chip-swatch" style="background:${item.color}"></span>
      <span><strong>${item.label}</strong><small>${item.role ?? item.type} · ${Math.round(item.intensity * 100)}%</small></span>
    </button>
  `).join('');
  document.querySelectorAll('[data-light-id]').forEach((button) => button.addEventListener('click', () => {
    lightSelect.value = button.dataset.lightId;
    refreshLightControls();
  }));
  document.querySelector('#light-role').textContent = `${light.role ?? light.type} · ${light.targetIds?.length ? `focused on ${light.targetIds.join(', ')}` : 'whole stage'}`;
  lightColor.value = light.color;
  lightIntensity.value = light.intensity;
  lightColorMix.value = light.colorMix ?? 0.25;
  lightSoftness.value = light.softness ?? 0.5;
  lightGobo.value = light.gobo ?? 'none';
  intensityValue.textContent = `${Math.round(light.intensity * 100)}%`;
  colorMixValue.textContent = `${Math.round((light.colorMix ?? 0.25) * 100)}%`;
  softnessValue.textContent = `${Math.round((light.softness ?? 0.5) * 100)}%`;
  lightTarget.innerHTML = `<option value="">Whole stage</option>${scene.objects.filter((item) => !item.locked).map((item) => `<option value="${item.id}">${item.label}</option>`).join('')}`;
  lightTarget.value = light.targetIds?.[0] ?? '';
}

function renderIntent(intent) {
  if (!intent) {
    intentSummary.innerHTML = '<span class="intent-empty">The planner will summarize setting, lifestyle, objects, and lighting after your first update.</span>';
    return;
  }
  intentSummary.innerHTML = `<div class="intent-title">Planner interpretation</div>
    <div class="intent-grid">
      <span><small>Setting</small>${intent.setting}</span>
      <span><small>Style</small>${intent.style ?? intent.mood ?? 'not specified'}</span>
      <span><small>Palette</small>${intent.palette}</span>
      <span><small>Light</small>${intent.lifestyle ?? intent.lightingCue ?? 'not specified'}</span>
    </div>
    <div class="intent-objects"><small>Scene candidates</small>${(intent.objects ?? []).join(' · ') || 'derived by the reasoning pass'}</div>
    <div class="intent-question"><small>Possible follow-up</small>${intent.questions?.[0] ?? 'Refine focus, palette, or lighting in the controls.'}</div>`;
}

function queueManualSync() {
  if (!backendSceneId) return;
  clearTimeout(manualSyncTimer);
  const expectedVersion = scene.version - 1;
  manualSyncTimer = setTimeout(async () => {
    try {
      await saveScene(backendSceneId, scene, expectedVersion, 'Manual stage or lighting edit');
    } catch (error) {
      document.querySelector('#connection-status').innerHTML = '<span class="status-dot"></span>Sync paused · refresh or retry after a version conflict';
    }
  }, 350);
}

function bindStageEvents() {
  const svg = stageWrap.querySelector('svg');
  if (!svg) return;
  let drag = null;
  svg.querySelectorAll('[data-object-id]').forEach((element) => {
    element.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      selectedObjectId = element.dataset.objectId;
      const object = scene.objects.find((item) => item.id === selectedObjectId);
      drag = { startX: event.clientX, startY: event.clientY, objectX: object.x, objectY: object.y };
      element.setPointerCapture?.(event.pointerId);
      selectedSummary.textContent = `Selected: ${selectedObjectId}`;
    });
    element.addEventListener('pointermove', (event) => {
      if (!drag || selectedObjectId !== element.dataset.objectId) return;
      const object = scene.objects.find((item) => item.id === selectedObjectId);
      object.x = Math.max(0.08, Math.min(0.92, drag.objectX + (event.clientX - drag.startX) / 760));
      object.y = Math.max(0.12, Math.min(0.88, drag.objectY + (event.clientY - drag.startY) / 460));
      element.setAttribute('transform', `translate(${object.x * 1000} ${object.y * 620})`);
    });
    element.addEventListener('pointerup', () => {
      if (drag) scene.version += 1;
      drag = null;
      refresh();
      queueManualSync();
    });
  });
}

function renderVersions() {
  const container = document.querySelector('#versions');
  if (!versions.length) {
    container.innerHTML = '<p class="empty">Saved versions will appear here.</p>';
    return;
  }
  container.innerHTML = versions.map((version) => `
    <button class="version" data-version-id="${version.id}">
      <span><strong>${version.label}</strong><small>${version.summary}</small></span>
      <span class="version-arrow">↗</span>
    </button>
  `).join('');
  container.querySelectorAll('[data-version-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = versions.find((item) => item.id === button.dataset.versionId);
      if (selected) {
        scene = cloneScene(selected.scene);
        selectedObjectId = null;
        refresh();
      }
    });
  });
}

document.querySelector('#apply-prompt').addEventListener('click', async () => {
  let result;
  try {
    if (!backendSceneId) throw new Error('Backend unavailable');
    result = await runAgent(backendSceneId, prompt.value, scene.version);
    scene = result.scene;
  } catch (error) {
    result = await agent.run({ input: prompt.value, scene });
    scene = applyPatch(scene, result.patch);
    document.querySelector('#connection-status').innerHTML = '<span class="status-dot"></span>Local fallback · backend unavailable';
  }
  assumptions.innerHTML = result.assumptions.length
    ? `<strong>Planner notes</strong>${result.assumptions.map((item) => `<span>${item}</span>`).join('')}`
    : '<span>Applied as an incremental update to the current scene.</span>';
  const validated = result.trace.patchValidated ?? result.trace.validation?.passed;
  agentMeta.textContent = `${result.trace.agent ?? result.trace.gateway} · ${result.trace.model} · patch validated: ${validated ? 'yes' : 'no'}`;
  renderIntent(result.intent);
  refresh();
});

document.querySelector('#reset-scene').addEventListener('click', () => {
  scene = createDefaultScene();
  selectedObjectId = null;
  assumptions.innerHTML = '<span>Reset to the default demo scene.</span>';
  renderIntent(null);
  refresh();
});

document.querySelector('#save-version').addEventListener('click', () => {
  versions.unshift({
    id: `version-${Date.now()}`,
    label: `Version ${versions.length + 1}`,
    summary: `${scene.objects.length} objects · ${scene.lights.length} lights`,
    scene: cloneScene(scene)
  });
  versions = versions.slice(0, 8);
  persist();
  renderVersions();
  if (backendSceneId) saveSnapshot(backendSceneId, `Version ${versions.length}`).catch(() => {});
});

lightSelect.addEventListener('change', refreshLightControls);
lightColor.addEventListener('input', () => {
  const light = scene.lights.find((item) => item.id === lightSelect.value);
  if (!light) return;
  light.color = lightColor.value;
  scene.version += 1;
  refresh();
  queueManualSync();
});
lightIntensity.addEventListener('input', () => {
  const light = scene.lights.find((item) => item.id === lightSelect.value);
  if (!light) return;
  light.intensity = Number(lightIntensity.value);
  scene.version += 1;
  refresh();
  queueManualSync();
});
lightColorMix.addEventListener('input', () => {
  const light = scene.lights.find((item) => item.id === lightSelect.value);
  if (!light) return;
  light.colorMix = Number(lightColorMix.value);
  scene.version += 1;
  refresh();
  queueManualSync();
});
lightSoftness.addEventListener('input', () => {
  const light = scene.lights.find((item) => item.id === lightSelect.value);
  if (!light) return;
  light.softness = Number(lightSoftness.value);
  scene.version += 1;
  refresh();
  queueManualSync();
});
lightGobo.addEventListener('change', () => {
  const light = scene.lights.find((item) => item.id === lightSelect.value);
  if (!light) return;
  light.gobo = lightGobo.value;
  scene.version += 1;
  refresh();
  queueManualSync();
});
lightTarget.addEventListener('change', () => {
  const light = scene.lights.find((item) => item.id === lightSelect.value);
  if (!light) return;
  light.targetIds = lightTarget.value ? [lightTarget.value] : [];
  scene.version += 1;
  refresh();
  queueManualSync();
});

function loadScene() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

function normalizeScene(saved) {
  const baseline = createDefaultScene();
  const next = saved ?? baseline;
  next.environment ??= baseline.environment;
  next.background ??= baseline.background;
  next.objects ??= baseline.objects;
  next.lights ??= [];
  baseline.lights.forEach((light) => {
    const existing = next.lights.find((item) => item.id === light.id);
    if (existing) Object.assign(existing, {
      role: light.role,
      colorMix: existing.colorMix ?? light.colorMix,
      softness: existing.softness ?? light.softness,
      beamWidth: existing.beamWidth ?? light.beamWidth,
      gobo: existing.gobo ?? light.gobo
    });
    else next.lights.push(light);
  });
  baseline.objects.filter((object) => object.type === 'curtain').forEach((object) => {
    if (!next.objects.some((existing) => existing.id === object.id)) next.objects.push(object);
  });
  return next;
}

function loadVersions() {
  try { return JSON.parse(localStorage.getItem(VERSION_KEY)) ?? []; } catch { return []; }
}

refresh();

connectBackend().then((record) => {
  backendSceneId = record.scene.sceneId;
  scene = normalizeScene(record.scene);
  document.querySelector('#connection-status').innerHTML = '<span class="status-dot"></span>FastAPI + SQLite connected';
  refresh();
}).catch(() => {
  document.querySelector('#connection-status').innerHTML = '<span class="status-dot"></span>Local fallback · start backend to persist';
});
