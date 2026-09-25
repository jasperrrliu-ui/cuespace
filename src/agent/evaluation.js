import { applyPatch, createDefaultScene } from '../scene.js';

export const defaultEvaluationCases = [
  {
    id: 'ordinary-apartment',
    input: 'An ordinary New York apartment at night with black, white, and gray furniture, a window, and stars behind the window.',
    checks: [
      result => result.trace.patchValidated,
      result => result.patch.operations.some(operation => operation.op === 'add_object' && operation.object.type === 'window'),
      result => result.patch.operations.some(operation => operation.op === 'add_light' && operation.light.gobo === 'stars')
    ]
  },
  {
    id: 'localized-red-practical',
    input: 'Use a strong red practical light but keep the furniture readable.',
    checks: [
      result => result.trace.patchValidated,
      result => result.patch.operations.some(operation => operation.op === 'update_light' && operation.id === 'ceiling-01' && operation.changes.colorMix > 0.7)
    ]
  }
];

export async function runAgentEvaluation({ agent, cases = defaultEvaluationCases, sceneFactory = createDefaultScene }) {
  const results = [];
  for (const testCase of cases) {
    const scene = sceneFactory();
    const result = await agent.run({ input: testCase.input, scene, sceneId: scene.sceneId });
    const nextScene = applyPatch(scene, result.patch);
    const checks = testCase.checks.map(check => Boolean(check(result, nextScene)));
    results.push({ id: testCase.id, passed: checks.every(Boolean), checks, trace: result.trace });
  }
  const passed = results.filter(result => result.passed).length;
  return {
    passed,
    total: results.length,
    passRate: results.length ? passed / results.length : 1,
    validPatchRate: results.length ? results.filter(result => result.trace.patchValidated).length / results.length : 1,
    averageDurationMs: results.length ? results.reduce((sum, result) => sum + result.trace.durationMs, 0) / results.length : 0,
    results
  };
}
