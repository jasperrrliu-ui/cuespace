function objectLayout(scene) {
  return scene.objects
    .filter((object) => !object.locked)
    .map((object) => ({ id: object.id, type: object.type, x: object.x, y: object.y, z: object.z }));
}

function lightPlan(scene) {
  return scene.lights.map((light) => ({
    id: light.id,
    role: light.role ?? light.type,
    targetIds: light.targetIds ?? [],
    color: light.color,
    intensity: light.intensity,
    colorMix: light.colorMix ?? 0,
    gobo: light.gobo ?? 'none'
  }));
}

export function createDesignPlan({ intent, scene, patch }) {
  return {
    version: 1,
    summary: intent ? `${intent.setting}; ${intent.style}; ${intent.lighting}` : 'Current scene retained',
    layout: objectLayout(scene),
    spatialRelations: scene.lights
      .filter((light) => light.targetIds?.length)
      .map((light) => ({ source: light.id, relation: 'lights', targets: light.targetIds })),
    constraints: [
      'preserve direct user edits',
      'keep objects within stage bounds',
      'keep lighting targets valid'
    ],
    lightingPlan: lightPlan(scene),
    proposedOperations: patch?.operations?.length ?? 0,
    rationale: 'The plan separates design intent from executable ScenePatch operations.'
  };
}
