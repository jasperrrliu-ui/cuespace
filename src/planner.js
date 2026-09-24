import { guidanceForText } from './knowledge.js?v=lighting-model-3';

function findLight(scene) {
  return scene.lights.find((light) => light.type === 'side') ?? scene.lights[0];
}

function hasObject(scene, type) {
  return scene.objects.some((object) => object.type === type);
}

function apartmentObjects(scene) {
  const objects = [
    { id: 'window-01', type: 'window', label: 'Apartment window', x: 0.78, y: 0.3, width: 0.2, height: 0.26, z: 2, color: '#6f85b9', opacity: 0.95 },
    { id: 'sofa-01', type: 'sofa', label: 'Compact sofa', x: 0.34, y: 0.66, width: 0.28, height: 0.16, z: 3, color: '#6f747c' },
    { id: 'rug-01', type: 'rug', label: 'Neutral rug', x: 0.47, y: 0.78, width: 0.42, height: 0.16, z: 2, color: '#777a80' },
    { id: 'cabinet-01', type: 'cabinet', label: 'Low storage cabinet', x: 0.72, y: 0.59, width: 0.22, height: 0.16, z: 3, color: '#b7b8b7' },
    { id: 'floor-lamp-01', type: 'floor_lamp', label: 'Floor lamp', x: 0.16, y: 0.57, width: 0.06, height: 0.25, z: 4, color: '#d9d5c8' }
  ];
  return objects.filter((object) => !scene.objects.some((existing) => existing.id === object.id));
}

function inferIntent(text, guidance, apartment) {
  const objects = [];
  if (apartment) objects.push('compact sofa', 'window', 'low storage', 'floor lamp');
  if (text.includes('table') || text.includes('桌')) objects.push('table');
  return {
    setting: apartment ? 'ordinary New York apartment' : 'black-box stage study',
    style: text.includes('contemporary') || text.includes('现代') ? 'contemporary' : 'stylized stage study',
    palette: text.includes('black') || text.includes('white') || text.includes('gray') || text.includes('黑') || text.includes('白') || text.includes('灰') ? 'black / white / gray' : 'guided by mood',
    lifestyle: text.includes('organized') || text.includes('整洁') || text.includes('organized') ? 'organized, restrained, controlled' : 'not specified',
    objects: objects.length ? objects : ['default stage objects'],
    lighting: guidance.label,
    questions: apartment ? ['Do you want the apartment to read as more lived-in, or deliberately sparse and controlled?'] : ['What kind of place should this design inhabit: theatre, apartment, outdoor space, or something abstract?']
  };
}

export function planFromText(input, scene) {
  const text = input.trim().toLowerCase();
  const light = findLight(scene);
  const operations = [];
  const assumptions = [];
  const guidance = guidanceForText(text);
  const apartment = text.includes('apartment') || text.includes('1b1b') || text.includes('1b1b') || text.includes('new york') || text.includes('纽约') || text.includes('租金') || text.includes('3500');
  const night = text.includes('night') || text.includes('moon') || text.includes('star') || text.includes('夜') || text.includes('月光') || text.includes('星光');
  const intent = inferIntent(text, guidance, apartment);

  if (!text) return { patch: { operations: [] }, assumptions: ['No text was provided; the current scene was kept.'] };

  operations.push({ op: 'update_background', changes: { color: apartment ? '#202126' : guidance.background } });
  operations.push({ op: 'update_environment', changes: { setting: apartment ? 'nyc_apartment' : 'black_box', style: intent.style, palette: intent.palette } });
  operations.push({ op: 'update_light', id: light.id, changes: { color: guidance.key.color, intensity: guidance.key.intensity, softness: guidance.key.softness } });
  const ambient = scene.lights.find((item) => item.type === 'ambient');
  if (ambient) operations.push({ op: 'update_light', id: ambient.id, changes: guidance.ambient });
  assumptions.push(`${guidance.label}: ${guidance.rationale}`);
  if (apartment) {
    apartmentObjects(scene).forEach((object) => operations.push({ op: 'add_object', object }));
    assumptions.push('Interpreted the setting as an ordinary, compact New York apartment rather than a luxury interior.');
    assumptions.push('Used restrained grayscale furnishings and a window/practical-light mix to suggest an organized, controlled lifestyle.');
  }
  if (night) {
    const windowLight = scene.lights.find((item) => item.type === 'window');
    if (windowLight) operations.push({ op: 'update_light', id: windowLight.id, changes: { color: '#9bb8ff', intensity: 0.68, colorMix: 0.22, gobo: 'window' } });
  }
  if (text.includes('red') || text.includes('红')) {
    const practical = scene.lights.find((item) => item.type === 'practical');
    if (practical) operations.push({ op: 'update_light', id: practical.id, changes: { color: '#ff2638', intensity: 0.82, colorMix: 0.82, softness: 0.34, gobo: 'none' } });
    assumptions.push('Bound the saturated red to the practical fixture instead of tinting every light in the scene.');
  }
  if (night && !scene.lights.some((item) => item.id === 'star-01')) {
    operations.push({ op: 'add_light', light: { id: 'star-01', label: 'Star gobo through window', role: 'pattern projection', type: 'projection', color: '#d8e3ff', intensity: 0.7, colorMix: 0.08, softness: 0.18, beamWidth: 0.32, gobo: 'stars', x: 0.84, y: 0.12, targetIds: ['window-01'] } });
    assumptions.push('Added a low-level star gobo behind the window because the prompt implies night or moonlight.');
  }
  if ((text.includes('warm') || text.includes('暖') || text.includes('soft') || text.includes('温柔'))) {
    operations.push({ op: 'update_light', id: light.id, changes: { color: '#f3a66b', intensity: Math.max(0.35, guidance.key.intensity - 0.08) } });
  }
  if ((text.includes('cool') || text.includes('blue') || text.includes('冷') || text.includes('蓝'))) {
    operations.push({ op: 'update_light', id: light.id, changes: { color: '#6e8cff' } });
  }
  if (text.includes('bright') || text.includes('亮')) {
    operations.push({ op: 'update_light', id: light.id, changes: { intensity: Math.min(1, light.intensity + 0.18) } });
  }
  if (text.includes('dark') || text.includes('dim') || text.includes('暗')) {
    operations.push({ op: 'update_light', id: light.id, changes: { intensity: Math.max(0.08, light.intensity - 0.18) } });
  }
  if (text.includes('suspense') || text.includes('mystery') || text.includes('悬疑')) {
    operations.push({ op: 'update_light', id: light.id, changes: { color: '#6e8cff', intensity: 0.58 } });
  }

  const table = scene.objects.find((object) => object.type === 'table');
  if (table && (text.includes('move') || text.includes('移动') || text.includes('放'))) {
    if (text.includes('left') || text.includes('左')) operations.push({ op: 'update_object', id: table.id, changes: { x: 0.31 } });
    else if (text.includes('right') || text.includes('右')) operations.push({ op: 'update_object', id: table.id, changes: { x: 0.69 } });
    else if (text.includes('center') || text.includes('中央') || text.includes('中间')) operations.push({ op: 'update_object', id: table.id, changes: { x: 0.5 } });
  }
  if ((text.includes('chair') || text.includes('椅')) && !hasObject(scene, 'chair')) {
    operations.push({ op: 'add_object', object: { id: `chair-${Date.now()}`, type: 'chair', label: 'Chair', x: 0.68, y: 0.69, width: 0.1, height: 0.15, z: 4, color: '#6f4b39' } });
  }
  if (!operations.length) assumptions.push('The local planner did not find a supported change, so the current scene was kept.');
  return { patch: { operations }, assumptions, intent };
}
