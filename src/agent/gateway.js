import { createDesignPlan } from './design-plan.js';

export function createDeterministicGateway({ planner }) {
  return {
    id: 'deterministic-local',
    model: 'mock-planner-v1',
    async plan(request) {
      const result = planner(request.input, request.scene, request.memory);
      return {
        ...result,
        provider: 'deterministic-local',
        model: 'mock-planner-v1'
      };
    }
  };
}

export function createTwoPassDeterministicGateway({ planner }) {
  return {
    id: 'deterministic-two-pass',
    model: 'mock-planner-v1',
    modelRoles: ['core', 'reasoning'],
    modelCount: 1,
    async plan(request) {
      // Core pass: interpret the request. Reasoning pass: consolidate the
      // interpretation into a spatial plan before the patch is validated.
      const core = planner(request.input, request.scene, request.memory);
      return {
        ...core,
        designPlan: createDesignPlan({ intent: core.intent, scene: request.scene, patch: core.patch }),
        provider: 'deterministic-local',
        model: 'mock-planner-v1'
      };
    }
  };
}

export function createModelGateway({ id, model, plan }) {
  if (typeof plan !== 'function') throw new TypeError('ModelGateway requires a plan function');
  return {
    id,
    model,
    async plan(request) {
      return plan(request);
    }
  };
}

// Future hosted, free-tier, or local open-weight adapters should implement the
// same async plan(request) contract. No provider SDK belongs in the UI layer.
