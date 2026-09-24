# CueSpace Product Requirements Document

## 1. Product

**CueSpace** is an accessible AI-assisted stage-design sandbox. It helps people without formal theatre-design or drawing training explore stage composition and lighting through natural-language input, optional reference images, and direct editing.

## 2. Problem

Stage design ideas are often difficult to express without drawing, modelling, or lighting knowledge. A generated image alone is not enough: users need to move objects, change lighting, compare versions, and iterate on a design.

## 3. Product principle

The canonical product state is an editable structured scene, not a generated image.

```text
text / image / later voice
        -> design intent
        -> editable SceneGraph
        -> deterministic 2D/2.5D renderer
        -> direct user edits and natural-language revisions
```

## 4. Initial users

People who want to explore stage layouts and lighting without professional theatre-design or drawing skills.

## 5. Stage 1 demo/MVP scope

Stage 1 is a stable, demonstrable vertical slice:

- text input for creating a stage concept;
- a small set of supported stage types and reusable assets;
- structured `DesignIntent` and validated `SceneGraph`;
- a 2D/2.5D interactive stage canvas;
- movable furniture and set pieces;
- editable lighting color, intensity, position, and basic type;
- deterministic re-rendering from scene state;
- natural-language incremental updates to the current scene;
- visible assumptions/defaults when input omits non-critical details;
- focused clarification when ambiguity materially changes the result;
- save/load and basic version comparison;
- a small synthetic/demo asset set;
- README, architecture documentation, tests, and a concise demo path.

Current implementation status: the first local vertical slice includes text input, a structured scene state, SVG-based deterministic rendering, draggable set pieces, lighting controls, local version snapshots, and a deterministic mock planner. External model, image, and voice integrations remain future stages.

The current Stage 1 polish also includes best-effort interpretation of setting/style/palette/lifestyle language, a compact apartment scene variant, visible planner assumptions, and a five-light local rig with independent controls.

## 6. Explicit Stage 1 non-goals

- professional 3D modelling or CAD;
- physical-light simulation;
- exact conversion of arbitrary sketches into editable geometry;
- automatic application of generated designs to a real theatre;
- multi-user collaboration;
- unrestricted asset marketplace;
- autonomous multi-agent orchestration;
- production claims about design correctness.

## 7. Input policy

Stage 1 starts with text. Reference-image input is an early extension only if the core scene workflow is stable. Images are treated as references by default; exact layout recognition is attempted only when the user explicitly requests it and remains subject to confirmation.

Voice is planned after text because browser audio first requires speech-to-text. The transcript becomes a text input with confidence metadata; it does not create a separate scene logic path.

## 8. Agent boundary

The first implementation uses one design-planning agent or a mock with the same contract. It may interpret intent, identify ambiguity, choose supported assets, and propose validated scene patches. It does not directly render pixels or mutate arbitrary application state.

Rendering, coordinate updates, validation, persistence, undo/redo, and versioning remain deterministic application code.

## 9. Roadmap

### Stage 0 — Foundation and confirmed design

- Establish repository documentation and working conventions.
- Confirm the initial `DesignIntent`, `SceneGraph`, patch, rendering, and version contracts.
- Define supported assets, default policy, clarification policy, and acceptance cases.

### Stage 1 — Demo/MVP

- Implement the text-to-scene vertical slice.
- Implement the 2D/2.5D renderer and editable canvas.
- Implement object movement and lighting controls.
- Add deterministic mock planning behind the agent contract.
- Add natural-language incremental scene patches.
- Add save/load, version snapshots, and the final demo flow.
- Test the core workflow and document known limitations.

### Stage 2 — Multimodal reference input

- Add PNG/JPEG/WebP upload.
- Classify reference purpose: layout, style, lighting, asset, or existing scene.
- Produce `ImageObservation` with confidence and uncertainty.
- Convert observations into `DesignIntent` without treating them as exact geometry.
- Add upload validation, failure states, and image privacy/retention policy.

### Stage 3 — Voice and learning assistance

- Add browser recording and speech-to-text.
- Preserve transcript confidence and allow transcript correction.
- Add curated stage-design guidance and explainable lighting suggestions.
- Keep knowledge retrieval separate from canonical scene state.

### Stage 4 — Controlled 3D migration

- Keep the existing SceneGraph and replace or supplement the renderer.
- Add depth, camera, materials, and limited 3D assets.
- Preserve the same user workflow and agent patch contract.
- Expand only after 2D/2.5D reliability is demonstrated.

### Stage 5 — Product hardening

- Improve asset management, accessibility, performance, export, and project history.
- Evaluate whether separate planning and lighting agents are justified by real workflow pressure.
- Add stronger regression sets and user studies.

## 10. Initial acceptance criteria

- A user can enter a text description and receive an editable stage.
- The stage contains stable identifiable objects rather than only a flattened image.
- A user can move at least one piece of furniture and change at least one light.
- Re-rendering preserves unrelated user edits.
- The same SceneGraph and render settings produce a reproducible result.
- Ambiguous but non-critical input uses visible defaults.
- Critical ambiguity produces a focused clarification question.
- A natural-language revision changes the current scene through a validated patch.
- A user can save and reopen a scene version.
- README and design records accurately distinguish implemented, mocked, and planned behavior.
