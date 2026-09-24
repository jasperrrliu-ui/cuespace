# CueSpace design record

Status: Stage 1 — minimal demo implementation in progress. The first vertical slice is local, deterministic, and mock-backed.

## 1. Confirmed product direction

CueSpace is an AI-assisted 2D/2.5D stage-design sandbox for non-specialists. The useful interaction is iterative: describe, inspect, edit, compare, and revise.

## 2. Core architecture

```text
Input adapters
  text / reference image / later voice
        -> DesignIntent
        -> planner agent or deterministic mock
        -> validated SceneGraph / ScenePatch
        -> deterministic renderer
        -> interactive editor and version store
```

The renderer is not an agent. The model does not own the source of truth. The SceneGraph is the source of truth, and direct user edits have priority over inferred values.

## 3. Multimodal strategy

The staged strategy is sequential rather than requiring one model to understand every modality at once:

```text
voice -> speech-to-text -> text input
image -> image observation
text + observations -> design intent
```

Stage 1 uses text. Reference images are planned for Stage 2 and voice for Stage 3. PNG, JPEG, and WebP are the initial image candidates. Images are references by default; exact recognition is opt-in and must remain reviewable.

## 4. DesignIntent v0 direction

The intent layer describes what the user wants, not exact pixel coordinates:

- `intent_type`: create or modify;
- `raw_request`;
- `space`;
- `composition`;
- conceptual `objects`;
- conceptual `lighting`;
- `mood` and exclusions;
- `style`;
- `camera_view`;
- `constraints`;
- `references`;
- `assumptions`;
- `uncertainties`;
- clarification state and confidence.

Not every field is user-required. Values must preserve provenance such as explicit, inferred, default, image-observed, or user-edited.

## 5. Default and clarification policy

- Use a reversible default when missing information does not materially change the result.
- Make important defaults visible to the user.
- Ask one focused question when ambiguity materially changes the scene or when an object/reference cannot be identified.
- Do not repeatedly ask for optional details before showing a useful first draft.
- User edits override Agent assumptions and defaults.

Initial defaults are a medium black-box stage, front view, stylized rendering, neutral low-to-medium ambient light, centered primary focus, and no unrequested complex furniture.

## 6. SceneGraph direction

The SceneGraph stores stable IDs for objects and lights, transforms, assets, layer/depth order, visibility, style, and relations. It is designed so that a 2.5D renderer can later be supplemented by a 3D renderer without changing the user intent or patch protocol.

## 7. Deterministic renderer direction

The renderer takes a SceneGraph and RenderConfig and produces a reproducible 2D/2.5D result. Initial lighting may use gradients, overlays, blur, and blend modes. This is an intentional visual approximation, not a claim of physical lighting simulation.

## 8. Revision loop

Direct manipulation applies deterministic local updates. Natural-language requests produce validated incremental patches against the current SceneGraph. The system must not regenerate the entire scene and erase user edits merely because the user requested a lighting change.

## 9. Open design decisions

The following will be confirmed before implementation:

- exact Stage 1 asset catalog;
- final DesignIntent fields and requiredness;
- SceneGraph object and light fields;
- patch operations and validation rules;
- renderer technology and supported effects;
- persistence format and version behavior;
- whether Stage 1 uses a mock planner, a real model, or both behind one gateway.

## 10. Stage 1 implementation decision

Stage 1 uses a deterministic local planner behind the same conceptual boundary as a future model-backed planner. It returns a small validated patch rather than free-form code or a replacement image. The current renderer uses SVG with simple gradients and layers. Persistence uses browser `localStorage` for the demo.

This is deliberately a vertical slice, not a production Agent integration. The mock is labeled in the UI and README. Future model calls must preserve the `DesignIntent`/`ScenePatch` boundary and pass validation before changing the SceneGraph.

## 11. Visual polish and guidance decision

The first renderer is intentionally code-native SVG rather than a generated bitmap. It now uses a layered stage frame, curtains, perspective floor, scrim lines, furniture geometry, gradients, shadows, and directional light beams. This preserves object identity and drag behavior while providing a credible visual study instead of flat placeholder rectangles.

`src/knowledge.js` is a small curated guidance module. It maps high-level mood terms to explainable background, ambient-light, and key-light suggestions. It is not a vector database, an authoritative theatre curriculum, or a real model memory system. It exists to prove the planning boundary: future retrieval or model reasoning can replace the guidance lookup without owning the SceneGraph or renderer.

## 12. Ambiguous natural-language input

Users are not required to learn a prompt template. The planner extracts a best-effort brief with setting, style, palette, lifestyle signal, candidate objects, and lighting direction. The UI displays that interpretation and one useful follow-up question. It renders a first draft instead of blocking on every missing field. Defaults remain visible and editable; only materially ambiguous information should become a blocking clarification in a future model-backed flow.

## 13. Lighting rig direction

Stage 1 now models multiple independent lights instead of one generic light: ambient wash, window daylight, ceiling practical, side/key light, and soft fill. Each light has a role, color, intensity, softness, position, and optional target IDs. This is still a visual approximation, not physical lighting, but it gives the user a meaningful composition workflow and leaves room for a larger rig in later stages.

## 14. Compose/revise interaction and color treatment

On narrow screens, Compose and Revise are a side-by-side workspace: the stage remains visible on the left while the lighting rig remains visible on the right. Describe stays above this workspace and Remember stays below it. This prioritizes iterative lighting changes over repeated vertical scrolling.

The renderer treats light color as a restrained influence rather than a full-scene color wash. Neutral white contribution provides brightness, while the selected hue contributes a lower-opacity spill and screen-like beam. Base wall/floor exposure was raised so lighting changes remain visible without turning the scene nearly black. This remains an approximation and is not a physical renderer.

## 15. Lighting model refinement

The lighting model now separates:

- `intensity`: nonlinear output response, so high output can become dramatically stronger than low output;
- `colorMix`: how much the selected hue influences the scene versus neutral brightness;
- `softness`: edge spread;
- `beamWidth`: approximate distribution;
- `targetIds`: intended receiving objects;
- `gobo`: an optional projected pattern such as window breakup, Venetian blinds, or stars;
- `type`: ambient, window, practical, side, fill, or projection.

This is based on the design distinction between fixture output, color, beam shaping, and gobo projection. CueSpace remains a 2D/2.5D visual approximation: it does not claim physical inverse-square lighting, DMX control, fixture photometry, or optical accuracy.

The planner now treats a strong red practical as a motivated local source, keeps a neutral key for furniture readability, and adds a low-level star gobo behind a window when the request implies night, moonlight, or stars. The user can still override every light manually.
