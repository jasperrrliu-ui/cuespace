const STRUCTURAL_TYPES = new Set(['wall', 'floor', 'scrim', 'curtain', 'rug']);

function bounds(object) {
  const width = Number(object.width ?? 0);
  const height = Number(object.height ?? 0);
  return {
    left: object.x - width / 2,
    right: object.x + width / 2,
    top: object.y - height / 2,
    bottom: object.y + height / 2,
    width,
    height
  };
}

function intersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function isMovable(object) {
  return !object.locked && !STRUCTURAL_TYPES.has(object.type) && object.type !== 'window';
}

export function validateSpatialScene(scene) {
  const errors = [];
  const movable = scene.objects.filter(isMovable);

  for (const object of movable) {
    const box = bounds(object);
    if (box.left < 0 || box.right > 1 || box.top < 0 || box.bottom > 1) {
      errors.push(`Object outside stage bounds: ${object.id}`);
    }
    if (box.width <= 0 || box.height <= 0) {
      errors.push(`Object has invalid dimensions: ${object.id}`);
    }
  }

  for (let index = 0; index < movable.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < movable.length; otherIndex += 1) {
      const first = movable[index];
      const second = movable[otherIndex];
      const overlap = intersectionArea(bounds(first), bounds(second));
      const smallerArea = Math.min(first.width * first.height, second.width * second.height);
      if (smallerArea > 0 && overlap / smallerArea > 0.45) {
        errors.push(`Objects overlap too much: ${first.id} and ${second.id}`);
      }
    }
  }

  const objectIds = new Set(scene.objects.map((object) => object.id));
  for (const light of scene.lights) {
    for (const targetId of light.targetIds ?? []) {
      if (!objectIds.has(targetId)) errors.push(`Light target does not exist: ${light.id} -> ${targetId}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
