// Curated stage-design guidance for the local demo.
// This is intentionally a small, inspectable knowledge base, not a claim of
// expert theatre validation or a vector database.
export const STAGE_GUIDANCE = {
  suspense: {
    label: 'Suspense',
    background: '#111827',
    ambient: { color: '#6c7897', intensity: 0.14 },
    key: { color: '#6681ff', intensity: 0.58, softness: 0.42 },
    rationale: 'Suspense is supported by a cool, directional key light, restrained ambient light, and visible negative space.'
  },
  warm: {
    label: 'Warm',
    background: '#211b1b',
    ambient: { color: '#d1a07d', intensity: 0.22 },
    key: { color: '#f2a66f', intensity: 0.54, softness: 0.68 },
    rationale: 'A warmer palette and softer key light make the stage feel intimate without flattening the set.'
  },
  dreamlike: {
    label: 'Dreamlike',
    background: '#172038',
    ambient: { color: '#9caeff', intensity: 0.26 },
    key: { color: '#b7c7ff', intensity: 0.42, softness: 0.9 },
    rationale: 'A dreamlike look uses a low-contrast cool wash, soft edges, and a translucent scrim.'
  },
  dramatic: {
    label: 'Dramatic red practical',
    background: '#21171c',
    ambient: { color: '#8a8792', intensity: 0.13 },
    key: { color: '#d7e1ff', intensity: 0.5, softness: 0.42 },
    rationale: 'A saturated red practical is kept as a motivated local source while a neutral key preserves furniture readability.'
  },
  neutral: {
    label: 'Neutral study',
    background: '#151922',
    ambient: { color: '#8892a8', intensity: 0.18 },
    key: { color: '#6e8cff', intensity: 0.65, softness: 0.5 },
    rationale: 'The neutral study keeps the set readable while leaving the user room to experiment.'
  }
};

export function guidanceForText(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes('suspense') || normalized.includes('mystery') || normalized.includes('悬疑') || normalized.includes('神秘')) return STAGE_GUIDANCE.suspense;
  if (normalized.includes('warm') || normalized.includes('暖') || normalized.includes('温柔') || normalized.includes('intimate')) return STAGE_GUIDANCE.warm;
  if (normalized.includes('red') || normalized.includes('红')) return STAGE_GUIDANCE.dramatic;
  if (normalized.includes('dream') || normalized.includes('梦') || normalized.includes('ethereal')) return STAGE_GUIDANCE.dreamlike;
  return STAGE_GUIDANCE.neutral;
}
