# CueSpace design record

Status: Stage 1 — minimal demo implementation in progress. The first vertical slice is local, deterministic, and mock-backed; the model-agnostic Agent backbone and lightweight memory skeleton are now present.

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

## 16. Memory architecture: future design, not Stage 1 scope

CueSpace should support memory, but the first implementation should remain small. The conceptual scopes are:

```text
User Memory
  -> Project Memory
      -> Scene Memory
          -> SceneGraph + Version History
```

These scopes are intentionally different:

- **User Memory** stores confirmed, cross-project preferences such as realism, acceptable color treatment, accessibility needs, and interaction style.
- **Project Memory** stores a project's goal, constraints, vocabulary, and confirmed design direction.
- **Scene Memory** stores the interpretation and unresolved design questions for one scene.
- **SceneGraph** stores the current editable state; it is not memory.
- **Version History** stores how the SceneGraph changed; it is not the Agent's long-term memory.

Stage 1 may use one local `memory` record containing confirmed preferences and notes. It does not need accounts, a memory service, vector storage, or a full project-management UI. The scope fields can be reserved in the data shape and implemented only when a real cross-project use case appears.

The Agent must not silently promote a temporary observation into a permanent user preference. Memory entries should carry scope, provenance, confidence, and status such as `temporary`, `inferred`, or `confirmed`. Cross-project preferences should normally require explicit user confirmation. Do not store private uploads, sensitive personal information, or hidden chain-of-thought.

## 17. Agent and model roles

CueSpace does not need multiple Agents for the initial product. One bounded design Agent can read scoped memory, interpret the request, retrieve guidance, propose a `ScenePatch`, explain assumptions, and decide whether to ask one focused question. Deterministic tools remain responsible for validation, patch application, rendering, persistence, and versioning.

The terms below describe replaceable model roles, not mandatory separate models:

- **Core model / primary model:** the normal language model that interprets user input, uses memory, and produces structured intent or a patch proposal.
- **Reasoning model:** an optional slower or stronger model used only for difficult ambiguity, conflict resolution, or multi-step lighting/composition planning. The core model can perform this role in Stage 2.
- **Vision model:** an optional image-capable model for Stage 2 reference-image observations. Its output is an observation with uncertainty, not direct geometry.
- **Speech-to-text model:** an optional Stage 3 input adapter. Its transcript feeds the same text intent path.
- **Embedding model:** an optional retrieval component for a larger knowledge base. It is not required for the small curated `src/knowledge.js` guidance module.

The first model-backed implementation should use one model through a `ModelGateway` interface. A second reasoning model is justified only if evaluations show that the primary model cannot reliably handle the relevant cases.

## 18. Agent harness boundary

The Agent harness is the deterministic system around a model. It includes:

- input normalization and conversation state;
- scoped memory read/write policy;
- prompt or request construction;
- structured output schemas for `DesignIntent` and `ScenePatch`;
- tool definitions and permission boundaries;
- schema validation and patch validation;
- clarification limits and stop conditions;
- retries, timeouts, fallbacks, and model routing;
- deterministic SceneGraph mutation and rendering;
- version snapshots, audit events, and user-visible explanations;
- regression fixtures and evaluation checks.

The model is only one component inside this harness. The renderer, SceneGraph, patch validator, version store, and UI are not Agents, even though the Agent can call them as tools. The current deterministic planner is a harness-compatible mock for the future model gateway.

## 19. Model deployment decision

The product should not depend on a particular model vendor. The planned boundary is:

```text
CueSpace Agent
  -> ModelGateway
      -> hosted commercial model
      -> free-tier API model
      -> local or self-hosted open-weight model
```

Open-weight or locally deployed models are technically viable, especially for text intent parsing and structured patch proposals. They may reduce per-call API cost and improve privacy, but they add hardware, setup, latency, model-serving, upgrade, and evaluation costs. "Free" therefore means no per-token vendor bill in some configurations, not zero operational cost.

Model selection must also check license terms, structured-output reliability, context length, tool-calling support, vision support when needed, and whether the hardware can run the model at acceptable latency. Stage 1 remains model-free. Stage 2 can begin with one replaceable hosted or local model, while the deterministic planner remains the fallback and regression oracle.

## 20. Implemented Agent backbone

The current code now contains the first harness skeleton:

```text
UI
  -> CueSpaceAgent
      -> scoped local MemoryStore
      -> ModelGateway
          -> deterministic planner (current adapter)
      -> ScenePatch validation
      -> SceneGraph application (UI-owned deterministic code)
      -> bounded scene note
```

`src/agent/harness.js` owns the Agent boundary and patch validation. `src/agent/gateway.js` owns the replaceable model contract. `src/agent/memory.js` owns a small local memory record with User, Project, and Scene-shaped scopes. The current memory writer records temporary scene notes only; permanent user preferences require an explicit confirmation path that is reserved but not exposed in the Stage 1 UI.

## 21. Initial model evaluation direction

The model is not selected yet. The backbone is intentionally implemented first so candidates can be evaluated against the same request and patch contract. For CueSpace, the first model must be an instruction-following model with reliable structured output or tool/function calling; raw image quality is not the primary criterion because the renderer is deterministic.

The initial open-weight shortlist for evaluation is:

- **Qwen3 instruct variants** for text planning and tool/function calling;
- **Mistral Small 3.1** for a compact model with function calling and a future path to image understanding;
- **Gemma 3** for a lightweight multimodal path when reference-image input becomes active.

These are candidates, not a final decision. Their official materials document tool/function calling or multimodal capability, but CueSpace still needs its own patch-validity, ambiguity, latency, and hardware tests. A hosted model or free-tier model can be tested through the same gateway.

The first deployment recommendation is one **core model** only. A separate **reasoning model** should be added only if evaluation shows that the core model cannot reliably resolve ambiguous scene intent, lighting conflicts, or memory conflicts. The harness should first try schema validation, a bounded repair retry, and the deterministic planner fallback. This keeps model count and operating cost small while preserving a path to a stronger reasoning route.

Evaluation cases should include: ordinary New York apartment interpretation, localized red practical versus global red wash, window light plus star gobo, user edits that must survive a natural-language revision, a deliberately ambiguous prompt, and an invalid patch. Metrics should include valid-patch rate, preservation of unrelated edits, clarification quality, latency, memory leakage across scopes, and local deployment cost.

## 22. Harness policy, observability, and evaluation

The initial harness policy is explicit and bounded:

- `maxTurns: 1` for the current single-pass Agent;
- `maxClarifications: 1` for a future model-backed clarification flow;
- `timeoutMs: 8000` for a model call;
- a deterministic fallback may be called when the primary gateway fails;
- the model receives cloned scene and memory data, not storage handles;
- the model cannot call `localStorage`, mutate the live SceneGraph, or bypass patch validation;
- patch base-version conflicts are rejected;
- the harness records trace ID, gateway/model, validation result, fallback use, duration, and policy limits.

`src/agent/observability.js` stores a bounded local trace buffer for the demo. It records operational metadata and outcomes, not hidden chain-of-thought. `src/agent/evaluation.js` provides repeatable cases and reports pass rate, valid-patch rate, average duration, and per-case checks. A conforming Agent must be evaluated on both happy paths and failure paths, including invalid output, timeout, ambiguous requests, memory-scope leakage, and preservation of direct user edits.

Observability answers "what happened?" Evaluation answers "did it satisfy the product contract?" Neither is replaced by a good-looking rendered image.

## 23. Core and reasoning roles

CueSpace now reserves two logical passes while keeping the first deployment to one model:

```text
one Qwen model (initial target)
  -> Core pass: text/image observation and DesignIntent
  -> Reasoning pass: spatial consolidation and DesignPlan
  -> deterministic validation and ScenePatch
```

The two passes are roles, not necessarily two different model instances. The current local gateway simulates this boundary and returns a `DesignPlan` containing layout, spatial relations, lighting plan, constraints, and proposed operation count. It does not yet claim physical 3D simulation. Spatial validity remains the responsibility of deterministic validators and the renderer.

This one-model/two-role approach is the initial Qwen deployment recommendation. A separate reasoning model can later be routed behind the same gateway if benchmark results show that the core model cannot reliably consolidate spatial relationships, actor clearance, lighting motivation, or conflicting constraints.

## 24. SceneGraph and spatial validation

The SceneGraph is structured canonical state, not a rendered image. It stores objects, lights, transforms, layers, styles, and selected relations. The renderer reads the SceneGraph and produces a transient 2D/2.5D view; an exported PNG or other file is a separate artifact created only when requested.

CueSpace does not need a general-purpose knowledge graph for Stage 1. A SceneGraph is a domain-specific spatial graph: objects are nodes and relations such as `in_front_of`, `faces`, `on`, `blocks`, and `lit_by` are controlled edges. Independent object fields remain simple, while relations capture the limited dependencies that matter to composition and staging.

The current harness now performs a first deterministic spatial validation pass. It checks movable-object bounds, excessive object overlap, and light target existence. Structural objects such as walls, floors, scrims, curtains, and rugs are treated differently from movable blocking objects. Future checks can add actor clearance, entrances/exits, sightlines, support/attachment rules, and intentional overlap declarations.

## 25. Minimal evaluation strategy

Stage 1 evaluation should be small and strict rather than a large academic benchmark. Use three layers:

1. **Contract tests:** valid JSON, allowed operations, valid IDs, valid ScenePatch, valid spatial state.
2. **Scenario tests:** a small fixture set such as `red chair + gray modern apartment`, `night window + stars`, `localized red practical`, and `preserve a manually moved object`.
3. **Human spot checks:** judge whether the resulting scene communicates the requested style, layout, and lighting without requiring pixel-level similarity.

For each scenario, score required entities/attributes, style/environment realization, spatial validity, preservation of user edits, and clarification/default behavior. Exact coordinates are not required unless the user specified them. A model can pass if it produces a different but valid layout that satisfies the request.
