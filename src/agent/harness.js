import { applyPatch } from '../scene.js';
import { validateSpatialScene } from './spatial-validator.js';

const ALLOWED_OPERATIONS = new Set([
  'update_object',
  'update_light',
  'add_object',
  'add_light',
  'update_background',
  'update_environment'
]);

function validatePatch(scene, patch) {
  const errors = [];
  if (patch?.baseVersion != null && patch.baseVersion !== scene.version) {
    errors.push(`Scene version conflict: expected ${scene.version}, received ${patch.baseVersion}`);
  }
  for (const operation of patch?.operations ?? []) {
    if (!ALLOWED_OPERATIONS.has(operation.op)) {
      errors.push(`Unsupported operation: ${operation.op}`);
      continue;
    }
    if (operation.op === 'update_object' && !scene.objects.some((item) => item.id === operation.id)) {
      errors.push(`Unknown object: ${operation.id}`);
    }
    if (operation.op === 'update_light' && !scene.lights.some((item) => item.id === operation.id)) {
      errors.push(`Unknown light: ${operation.id}`);
    }
    if ((operation.op === 'add_object' || operation.op === 'add_light') && !operation.object && !operation.light) {
      errors.push(`Missing payload for: ${operation.op}`);
    }
  }
  if (errors.length === 0) {
    const candidate = applyPatch(scene, { ...patch, baseVersion: undefined });
    errors.push(...validateSpatialScene(candidate).errors);
  }
  return { valid: errors.length === 0, errors };
}

function compactIntent(intent) {
  if (!intent) return 'No structured interpretation was returned.';
  return `${intent.setting}; ${intent.style}; ${intent.palette}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withTimeout(promise, timeoutMs) {
  if (!timeoutMs) return promise;
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Model timeout after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

export function createCueSpaceAgent({ gateway, memoryStore, fallbackGateway = null, telemetry = null, policy = {} }) {
  const limits = { maxTurns: 1, maxClarifications: 1, timeoutMs: 8000, ...policy };
  return {
    id: 'cuespace-agent-v1',
    async run({ input, scene, projectId = 'default-project', sceneId = scene.sceneId }) {
      const memory = memoryStore.context({ projectId, sceneId });
      const startedAt = performance.now();
      const traceId = `trace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const request = { input, scene: clone(scene), memory: clone(memory), turn: 0, maxTurns: limits.maxTurns, maxClarifications: limits.maxClarifications };
      telemetry?.record({ traceId, event: 'agent.run.started', gateway: gateway.id, model: gateway.model });
      let result;
      let activeGateway = gateway;
      try {
        result = await withTimeout(gateway.plan(request), limits.timeoutMs);
      } catch (error) {
        telemetry?.record({ traceId, event: 'agent.gateway.failed', message: error.message });
        if (!fallbackGateway) {
          result = { patch: { operations: [] }, assumptions: [`The model gateway failed: ${error.message}`], intent: null, provider: gateway.id, model: gateway.model };
        } else {
          activeGateway = fallbackGateway;
          result = await withTimeout(fallbackGateway.plan(request), limits.timeoutMs);
        }
      }
      const validation = validatePatch(scene, result.patch);
      const safeResult = validation.valid ? result : {
        patch: { operations: [] },
        assumptions: ['The Agent proposal failed validation, so the current scene was kept.'],
        intent: result.intent,
          provider: result.provider,
          model: result.model
      };
      if (!validation.valid) safeResult.assumptions.push(...validation.errors);
      memoryStore.recordSceneNote(sceneId, `Last request: ${input.trim() || '(empty)'}; interpretation: ${compactIntent(safeResult.intent)}`);
      const response = {
        ...safeResult,
        trace: {
          traceId,
          agent: 'cuespace-agent-v1',
          gateway: activeGateway.id,
          model: activeGateway.model,
          modelRoles: activeGateway.modelRoles ?? ['core'],
          modelCount: activeGateway.modelCount ?? 1,
          memoryScopes: ['user', 'project', 'scene'],
          patchValidated: validation.valid,
          fallbackUsed: activeGateway.id !== gateway.id,
          maxTurns: limits.maxTurns,
          maxClarifications: limits.maxClarifications,
          timeoutMs: limits.timeoutMs,
          durationMs: Math.round(performance.now() - startedAt)
        }
      };
      telemetry?.record({ traceId, event: 'agent.run.completed', patchValidated: validation.valid, fallbackUsed: response.trace.fallbackUsed, durationMs: response.trace.durationMs });
      return response;
    }
  };
}

export { validatePatch };
