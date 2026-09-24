const WIDTH = 1000;
const HEIGHT = 620;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]));
}

function lightDefs(light) {
  const effective = Math.pow(Math.max(0, light.intensity), 1.65);
  const whiteStrength = Math.min(0.3, 0.05 + effective * 0.26);
  const colorStrength = Math.min(0.42, 0.015 + effective * (0.32 * (light.colorMix ?? 0.25)));
  return `<radialGradient id="gradient-${escapeXml(light.id)}" cx="50%" cy="42%" r="62%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="${whiteStrength}"/>
    <stop offset="38%" stop-color="${escapeXml(light.color)}" stop-opacity="${colorStrength}"/>
    <stop offset="70%" stop-color="${escapeXml(light.color)}" stop-opacity="${colorStrength * 0.35}"/>
    <stop offset="100%" stop-color="${escapeXml(light.color)}" stop-opacity="0"/>
  </radialGradient>`;
}

function goboDefs(light) {
  if (!light.gobo || light.gobo === 'none') return '';
  if (light.gobo === 'stars') return `<pattern id="gobo-${escapeXml(light.id)}" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="transparent"/><circle cx="12" cy="16" r="2.2" fill="#fff"/><circle cx="42" cy="28" r="1.4" fill="#fff"/><circle cx="26" cy="56" r="1.7" fill="#fff"/><circle cx="61" cy="9" r="1" fill="#fff"/></pattern>`;
  if (light.gobo === 'window') return `<pattern id="gobo-${escapeXml(light.id)}" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M -20 75 L 75 -20 M 15 110 L 110 15" stroke="#fff" stroke-opacity=".42" stroke-width="8"/></pattern>`;
  if (light.gobo === 'venetian') return `<pattern id="gobo-${escapeXml(light.id)}" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M -20 20 L 20 -20 M -20 50 L 50 -20 M 10 80 L 80 10" stroke="#fff" stroke-opacity=".5" stroke-width="10"/></pattern>`;
  return '';
}

function objectMarkup(object) {
  const x = object.x * WIDTH;
  const y = object.y * HEIGHT;
  const width = object.width * WIDTH;
  const height = object.height * HEIGHT;
  const opacity = object.opacity ?? 1;
  const common = `data-object-id="${escapeXml(object.id)}" transform="translate(${x} ${y})" opacity="${opacity}"`;

  if (object.type === 'wall') {
    return `<g ${common}><rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="12" fill="url(#wall-gradient)"/>
      <path d="M ${-width / 2 + 24} 0 H ${width / 2 - 24}" stroke="#dbe1ff" stroke-opacity=".055"/>
      <path d="M 0 ${-height / 2 + 22} V ${height / 2 - 18}" stroke="#dbe1ff" stroke-opacity=".035"/></g>`;
  }
  if (object.type === 'floor') {
    return `<g ${common}><path d="M ${-width / 2} ${-height * .38} L ${width / 2} ${-height * .38} L ${width * .46} ${height / 2} L ${-width * .46} ${height / 2} Z" fill="url(#floor-gradient)"/>
      <path d="M ${-width * .46} ${height * .17} H ${width * .46} M ${-width * .43} ${height * .36} H ${width * .43}" stroke="#ead7c5" stroke-opacity=".075"/>
      <path d="M ${-width * .24} ${-height * .38} L ${-width * .18} ${height / 2} M 0 ${-height * .38} V ${height / 2} M ${width * .24} ${-height * .38} L ${width * .18} ${height / 2}" stroke="#ead7c5" stroke-opacity=".055"/></g>`;
  }
  if (object.type === 'scrim') {
    return `<g ${common}><rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="5" fill="url(#scrim-gradient)" stroke="#e7e8ee" stroke-opacity=".34" stroke-dasharray="9 8"/>
      ${Array.from({ length: 8 }, (_, index) => `<path d="M ${-width / 2 + 28 + index * 70} ${-height / 2} V ${height / 2}" stroke="#ffffff" stroke-opacity=".1"/>`).join('')}
      <path d="M ${-width / 2} 0 H ${width / 2}" stroke="#fff" stroke-opacity=".13"/></g>`;
  }
  if (object.type === 'table') {
    return `<g ${common}>
      <ellipse cx="0" cy="${height * .48}" rx="${width * .48}" ry="${height * .12}" fill="#090b11" opacity=".42" filter="url(#soft-shadow)"/>
      <path d="M ${-width * .42} ${-height * .08} L ${-width * .33} ${height * .14} L ${width * .33} ${height * .14} L ${width * .42} ${-height * .08} Z" fill="url(#wood-gradient)" stroke="#d99b69" stroke-opacity=".2"/>
      <rect x="${-width * .43}" y="${-height * .22}" width="${width * .86}" height="${height * .26}" rx="6" fill="${object.color}"/>
      <path d="M ${-width * .3} ${height * .02} V ${height * .55} M ${width * .3} ${height * .02} V ${height * .55}" stroke="#3c2924" stroke-width="12" stroke-linecap="round"/>
      <path d="M ${-width * .33} ${height * .46} H ${width * .33}" stroke="#d99b69" stroke-opacity=".16" stroke-width="3"/></g>`;
  }
  if (object.type === 'chair') {
    return `<g ${common}>
      <ellipse cx="0" cy="${height * .49}" rx="${width * .46}" ry="${height * .1}" fill="#090b11" opacity=".4" filter="url(#soft-shadow)"/>
      <rect x="${-width * .38}" y="${-height * .45}" width="${width * .76}" height="${height * .55}" rx="6" fill="${object.color}" stroke="#d99b69" stroke-opacity=".16"/>
      <rect x="${-width * .42}" y="${height * .05}" width="${width * .84}" height="${height * .15}" rx="4" fill="#8e5f48"/>
      <path d="M ${-width * .3} ${height * .16} V ${height * .55} M ${width * .3} ${height * .16} V ${height * .55}" stroke="#382725" stroke-width="9" stroke-linecap="round"/></g>`;
  }
  if (object.type === 'curtain') {
    return `<g ${common}><path d="M ${-width / 2} ${-height / 2} Q 0 ${-height * .38} ${width / 2} ${-height / 2} L ${width / 2} ${height / 2} Q 0 ${height * .3} ${-width / 2} ${height / 2} Z" fill="url(#curtain-gradient)"/>
      <path d="M ${-width * .18} ${-height / 2} Q ${width * .04} 0 ${-width * .12} ${height / 2} M ${width * .16} ${-height / 2} Q ${-width * .02} 0 ${width * .08} ${height / 2}" stroke="#777994" stroke-opacity=".16" stroke-width="5"/></g>`;
  }
  if (object.type === 'window') {
    return `<g ${common}><rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="5" fill="#172238" stroke="#d7dbe8" stroke-opacity=".5" stroke-width="5"/>
      <rect x="${-width * .4}" y="${-height * .34}" width="${width * .8}" height="${height * .68}" fill="url(#window-gradient)"/>
      <path d="M 0 ${-height * .34} V ${height * .34} M ${-width * .4} 0 H ${width * .4}" stroke="#e9edf8" stroke-opacity=".3" stroke-width="3"/>
      <path d="M ${-width * .32} ${height * .22} H ${width * .32}" stroke="#a7b4d6" stroke-opacity=".35" stroke-width="3"/></g>`;
  }
  if (object.type === 'sofa') {
    return `<g ${common}><ellipse cx="0" cy="${height * .48}" rx="${width * .48}" ry="${height * .1}" fill="#080a10" opacity=".42" filter="url(#soft-shadow)"/>
      <rect x="${-width / 2}" y="${-height * .25}" width="${width}" height="${height * .58}" rx="12" fill="${object.color}" stroke="#e3e4e6" stroke-opacity=".16"/>
      <rect x="${-width * .42}" y="${-height * .48}" width="${width * .84}" height="${height * .42}" rx="12" fill="${object.color}" stroke="#e3e4e6" stroke-opacity=".14"/>
      <path d="M ${-width * .08} ${-height * .22} V ${height * .25}" stroke="#f0f0f0" stroke-opacity=".13" stroke-width="3"/></g>`;
  }
  if (object.type === 'rug') {
    return `<g ${common}><ellipse cx="0" cy="0" rx="${width / 2}" ry="${height / 2}" fill="${object.color}" opacity=".48" stroke="#ded6cc" stroke-opacity=".24" stroke-dasharray="7 7"/><ellipse cx="0" cy="0" rx="${width * .36}" ry="${height * .28}" fill="none" stroke="#ded6cc" stroke-opacity=".16"/></g>`;
  }
  if (object.type === 'cabinet') {
    return `<g ${common}><ellipse cx="0" cy="${height * .48}" rx="${width * .45}" ry="${height * .1}" fill="#090b11" opacity=".35" filter="url(#soft-shadow)"/>
      <rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="4" fill="${object.color}"/>
      <path d="M 0 ${-height / 2} V ${height / 2}" stroke="#55575a" stroke-opacity=".35"/>
      <circle cx="${-width * .18}" cy="0" r="3" fill="#393b40"/><circle cx="${width * .18}" cy="0" r="3" fill="#393b40"/></g>`;
  }
  if (object.type === 'floor_lamp') {
    return `<g ${common}><path d="M 0 ${height * .46} V ${-height * .2}" stroke="#d5d0c5" stroke-width="5"/><path d="M ${-width * .48} ${height * .46} H ${width * .48}" stroke="#d5d0c5" stroke-width="4"/>
      <path d="M ${-width * .38} ${-height * .2} L ${width * .38} ${-height * .2} L ${width * .25} ${-height * .46} L ${-width * .25} ${-height * .46} Z" fill="${object.color}" stroke="#fff3d1" stroke-opacity=".3"/></g>`;
  }
  return `<rect ${common} x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" fill="${object.color ?? '#aaa'}"/>`;
}

function renderBeam(light) {
  if (light.type === 'ambient' || light.type === 'projection') return '';
  const x = light.x * WIDTH;
  const y = light.y * HEIGHT;
  const spread = 70 + (light.beamWidth ?? 0.5) * 170;
  const alpha = Math.min(0.16, Math.pow(light.intensity, 1.35) * 0.15);
  return `<path d="M ${x} ${y} L ${500 - spread} 490 L ${500 + spread} 490 Z" fill="${escapeXml(light.color)}" opacity="${alpha}" style="mix-blend-mode:screen" filter="url(#beam-blur)" pointer-events="none"/>`;
}

function renderGoboProjection(light, scene) {
  if (!light.gobo || light.gobo === 'none') return '';
  const targetId = light.targetIds?.[0];
  const target = scene.objects.find((object) => object.id === targetId) ?? scene.objects.find((object) => object.type === 'wall');
  if (!target) return '';
  const x = target.x * WIDTH - target.width * WIDTH / 2;
  const y = target.y * HEIGHT - target.height * HEIGHT / 2;
  const width = target.width * WIDTH;
  const height = target.height * HEIGHT;
  const opacity = Math.min(0.5, 0.08 + Math.pow(light.intensity, 1.4) * 0.42);
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#gobo-${escapeXml(light.id)})" opacity="${opacity}" style="mix-blend-mode:screen" pointer-events="none"/>`;
}

export function renderScene(scene) {
  const defs = `${scene.lights.map(lightDefs).join('')}${scene.lights.map(goboDefs).join('')}
    <linearGradient id="wall-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#596783"/><stop offset="1" stop-color="#303849"/></linearGradient>
    <linearGradient id="floor-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#777177"/><stop offset="1" stop-color="#39363f"/></linearGradient>
    <linearGradient id="scrim-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d3dcff" stop-opacity=".05"/><stop offset=".5" stop-color="#eef1ff" stop-opacity=".18"/><stop offset="1" stop-color="#d3dcff" stop-opacity=".04"/></linearGradient>
    <linearGradient id="curtain-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#080a11"/><stop offset=".5" stop-color="#29243a"/><stop offset="1" stop-color="#0b0c13"/></linearGradient>
    <linearGradient id="wood-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d29a68"/><stop offset=".5" stop-color="#a9674b"/><stop offset="1" stop-color="#6f4338"/></linearGradient>
    <linearGradient id="window-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93b2e3"/><stop offset=".38" stop-color="#687ea9"/><stop offset="1" stop-color="#242a3a"/></linearGradient>
    <filter id="soft-shadow"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="beam-blur"><feGaussianBlur stdDeviation="18"/></filter>`;
  const baseObjects = [...scene.objects].sort((a, b) => a.z - b.z).filter((object) => object.z < 3).map(objectMarkup).join('');
  const foregroundObjects = [...scene.objects].sort((a, b) => a.z - b.z).filter((object) => object.z >= 3).map(objectMarkup).join('');
  const beams = scene.lights.map(renderBeam).join('');
  const projections = scene.lights.map((light) => renderGoboProjection(light, scene)).join('');
  const lightWashes = scene.lights.map((light) => {
    if (light.type === 'ambient') return `<rect x="80" y="70" width="840" height="480" fill="url(#gradient-${escapeXml(light.id)})" style="mix-blend-mode:screen" pointer-events="none"/>`;
    return `<circle cx="${light.x * WIDTH}" cy="${light.y * HEIGHT}" r="350" fill="url(#gradient-${escapeXml(light.id)})" style="mix-blend-mode:screen" pointer-events="none"/>`;
  }).join('');

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Editable stage scene">
    <defs>${defs}</defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${escapeXml(scene.background.color)}"/>
    <rect x="46" y="40" width="908" height="540" rx="24" fill="#0b0d14" stroke="#7280a8" stroke-opacity=".23"/>
    <rect x="70" y="62" width="860" height="496" rx="18" fill="#171c2a" stroke="#dce3ff" stroke-opacity=".12"/>
    ${baseObjects}
    ${beams}
    ${lightWashes}
    ${foregroundObjects}
    ${projections}
    <path d="M 70 540 H 930" stroke="#e4e8ff" stroke-opacity=".18"/>
    <text x="94" y="94" fill="#ffffff" fill-opacity=".64" font-size="13" letter-spacing="2.4">CUESPACE / STAGE STUDY</text>
    <text x="94" y="116" fill="#ffffff" fill-opacity=".32" font-size="10" letter-spacing="1.6">LIGHTING EXPLORATION · ${escapeXml(scene.versionLabel ?? 'LOCAL STUDY')}</text>
  </svg>`;
}
