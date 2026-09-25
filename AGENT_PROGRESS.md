# Agent progress

## Current status

Updated: 2026-09-24.

**Completed:** Inspected the initial CueSpace repository and the AMDEX repository conventions. Confirmed the product name CueSpace and the initial product direction: an accessible 2D/2.5D stage-design sandbox with structured editable scenes, lighting controls, and an iterative user feedback loop. Added repository working conventions, product requirements, roadmap, and design record. Implemented the first local Stage 1 vertical slice: Vite app, structured SceneGraph, SVG renderer, draggable set pieces, lighting controls, local version snapshots, and a deterministic mock planner. Polished the renderer with stage framing, curtains, perspective floor, material gradients, furniture detail, shadows, scrim detail, and directional light beams. Added a small explainable mood-to-lighting guidance module. Added best-effort prompt interpretation, a compact ordinary-apartment scene variant, visible planner interpretation/assumptions, and a five-light rig with independent selection and controls.

**In progress:** Stage 1 demo hardening and verification. The SceneGraph and patch contracts are intentionally minimal and local. The UI needs build/browser verification after dependencies are installed.

**Not started:** Real model integration, image upload, voice input, curated knowledge base, and 3D rendering.

**Decisions:** Stage 1 starts with text input and a stable 2D/2.5D vertical slice. The SceneGraph is the source of truth; generated images are not. Rendering is deterministic application code, not an Agent. Missing low-impact fields use visible reversible defaults; material ambiguity receives a focused question. Images are references by default and exact recognition is opt-in. Voice is deferred until text is stable.

**Next steps:** Install dependencies, run the Vite build, manually exercise the text-to-scene/edit/save loop, add lightweight regression checks, and refine the contracts only where the demo reveals a real need. Then decide whether to add Stage 2 image references.

**Validation performed:** Node.js and npm availability were checked. Dependencies installed with a repository-local npm cache using `npm install --ignore-scripts --no-audit --no-fund`. `node --check` passed for every `src/*.js` file and `git diff --check` passed. Static browser verification passed for the polished renderer, natural-language suspense guidance, ordinary New York apartment interpretation, apartment objects, five-light rendering, independent light selection, version persistence after reload, and furniture dragging. `npm run build` was attempted but Vite failed before transforming modules with Windows `spawn EPERM`; this remains an environment-level verification limitation.

## History

### 2026-09-25 — Stages 0–6 local backend implementation

Implemented a runnable local backend under `backend/`: FastAPI routes, SQLite persistence, the canonical JSON SceneGraph, immutable scene-version snapshots, concise scene/project memory entries, Agent run records, and traces. The API accepts a text run, reads the current SceneGraph plus scoped memory, calls a two-logical-pass deterministic planner, validates its ScenePatch, persists the validated next SceneGraph, then returns the scene, plan, assumptions, and trace. Added Level 1 structural validation (operations, known ids, base version) and Level 2 spatial validation (bounds, positive dimensions, excessive overlap, valid light targets). Invalid agent patches retain the prior scene and record a fallback trace. Added backend API tests for a New York apartment/night/stars scenario, persisted trace retrieval, stale-version rejection, and invalid manual edit rejection. Added `docs/ARCHITECTURE.md` to distinguish SceneGraph from rendered image, ScenePatch from SceneGraph, trace fields from storage, Model Gateway from HTTP API, and current local storage from later cloud/object storage. The browser now attempts to connect to this backend first; text prompts and manual lighting/set movements sync through HTTP, while a visibly labelled local fallback remains available if the backend is not running. No hosted model, Qwen key, GPU runtime, image upload, or cloud deployment has been added.

### 2026-09-23 — Repository orientation and Stage 0 documentation

Inspected CueSpace (`README.md`, initial Git state) and AMDEX (`AGENTS.md`, `PRD.md`, `README.md`, `AGENT_PROGRESS.md`, repository layout and commit history). CueSpace had only an initial README and initial commit. Added `AGENTS.md`, `PRD.md`, `docs/DESIGN.md`, and this progress log. Recorded the Stage 1 text-to-editable-2D/2.5D vertical slice, staged multimodal roadmap, SceneGraph/deterministic-renderer boundary, default/clarification policy, and future 3D migration path. No application implementation or runtime checks were performed.

### 2026-09-23 — Stage 1 minimal vertical slice

Added the Vite frontend and a local editable stage demo. Files include `index.html`, `package.json`, `src/main.js`, `src/scene.js`, `src/planner.js`, `src/renderer.js`, and `src/styles.css`. The scene is represented as structured objects and lights; SVG renders it deterministically; furniture can be dragged; light color and intensity can be changed; versions are saved in browser localStorage; natural-language updates use a clearly labeled deterministic mock planner that returns incremental scene operations. Updated README, PRD, and design records to reflect the implementation boundary. Dependencies, build, browser behavior, and accessibility checks remain pending.

### 2026-09-23 — Stage 1 verification attempt

Installed dependencies with a repository-local npm cache. JavaScript syntax checks passed for all source files and `git diff --check` passed. The Vite production build was attempted twice; dependency installation initially hit the global npm cache, then succeeded with `--ignore-scripts`, but Vite itself failed at startup with Windows `spawn EPERM` before transforming modules. This is an environment verification blocker, not an observed application exception. Added `.gitignore` for generated dependencies/cache/build output. Browser verification remains pending.

### 2026-09-23 — Stage 1 browser smoke test

Served the repository with Python's static server because Vite build/startup remains blocked by Windows `spawn EPERM`. Verified that the UI mounts, the local planner changes the table position and light color, saved versions survive a page reload, and a furniture drag updates the SceneGraph and version. Fixed drag handling so pointer movement updates the existing SVG element during the gesture and only commits a render on pointer release; re-rendering on every pointermove had broken continuous dragging. Kept the local demo tab available for review.

### 2026-09-24 — Responsive layout fix

Reviewed the narrow-viewport screenshot. The previous breakpoint kept the input and history panels in a two-column layout, causing horizontal clipping. Changed the responsive layout to a single-column order of stage, input/lighting controls, and versions; added grid min-width protections and a smaller mobile stage treatment. Browser verification at the current narrow viewport showed no horizontal overflow (`scrollWidth` 763 versus viewport width 778).

### 2026-09-24 — Renderer polish and curated guidance

Replaced the flat SVG primitives with a layered stage study: proscenium frame, curtains, perspective floor, wall and wood gradients, scrim lines, furniture highlights and shadows, ambient washes, and directional beams. Added `src/knowledge.js` with small explainable mood presets for suspense, warm, dreamlike, and neutral designs. Updated the planner to produce background, ambient-light, key-light, and rationale patches while preserving the deterministic SceneGraph boundary. Browser smoke verification confirmed the polished render and a suspense prompt changed the scene background and lighting with a visible planner explanation.

### 2026-09-24 — Ambiguous prompt interpretation and multi-light rig

Expanded the planner and SceneGraph for freeform user input. Prompts mentioning an ordinary New York apartment, 1B1B, black/white/gray palette, or organized lifestyle now produce an interpretable apartment variant with window, sofa, rug, storage, and floor-lamp objects. The UI displays setting, style, palette, lifestyle signal, candidate objects, and one follow-up question rather than requiring a prompt template. Expanded the rig to ambient, window daylight, ceiling practical, side/key, and fill lights with independent role, color, intensity, softness, and focus target controls. Fixed light selection persistence across UI refreshes. Browser smoke checks confirmed 12 objects, 5 lights, apartment interpretation, and independent window-light selection.

### 2026-09-24 — Static preview cache fix

The existing port-4173 browser tab was serving cached ES modules, making the updated planner appear inactive even though a clean origin worked. Added versioned module query parameters to the static preview entry/imports. Re-tested on the original port: apartment prompt now produces planner notes, interpretation, 12 objects, and 5 lights. This is a preview cache workaround; Vite remains the intended development server when its Windows process-spawn issue is resolved.

### 2026-09-24 — Section order adjustment

Split the lighting revision controls into their own panel instead of nesting them inside Describe. The responsive order is now Describe → Compose → Revise → Remember, matching the intended user workflow. Desktop keeps Describe and Revise in the left column, Compose in the center, and Versions in the right column. Browser layout verification confirmed the expected top positions on the current narrow viewport.

### 2026-09-24 — Side-by-side lighting workspace and light treatment

Wrapped Compose and Revise into a shared `compose-review` workspace. On narrow screens the stage and lighting controls now sit side by side, with Describe above and Remember below; browser verification showed no horizontal overflow. Adjusted SVG lighting so neutral white contribution carries brightness, color contributes restrained spill, beams use screen-like blending, and base wall/floor exposure is higher. This reduces the previous dark, whole-scene hue wash while keeping light color perceptible. Browser console reported no errors after the change.

### 2026-09-24 — Fixture intensity, gobos, and motivated sources

Refined the lighting model after reviewing theatrical fixture/gobo references. Added nonlinear intensity, separate color influence, beam width, gobo selection, and projection light type. Added window-breakup, Venetian-blind, and star-field patterns. Night/moon/star prompts now add a low-level star gobo behind the window; red practical prompts drive a local high-colorMix ceiling fixture while leaving the key light readable. Added controls for color influence and gobo pattern. Browser verification confirmed a night apartment prompt produces 12 objects and 6 lights, including a red practical, blue window source, and star projection; the mobile side-by-side workspace renders without console errors.

### 2026-09-24 — Commit preparation

Recorded the current Stage 1 implementation as the first complete reviewable demo snapshot. The repository is ready for a user-owned Git commit and optional push. Known limitation remains the Windows Vite `spawn EPERM` build issue; static browser verification and JavaScript syntax checks pass, and no external model/API key is required for the current demo.

### 2026-09-24 — Future Agent, memory, harness, and model decisions

Recorded the future architecture without expanding Stage 1 implementation. CueSpace will prefer one bounded Agent over multiple Agents. The conceptual memory scopes are User, Project, and Scene, while SceneGraph remains current editable state and Version History remains change history. Stage 1 only needs a small local memory record for confirmed preferences and notes. Defined model roles as optional and replaceable: core language model, reasoning model for difficult cases, vision model for image references, speech-to-text model for voice, and embedding model for larger retrieval. Defined the deterministic Agent harness as the surrounding schemas, memory policy, tool boundary, validator, patch application, renderer, persistence, retry/timeout/fallback logic, audit events, and evaluation fixtures. Documented that hosted, free-tier, and local/open-weight models are all compatible behind a ModelGateway, with local deployment carrying hardware, serving, licensing, latency, maintenance, and evaluation costs. None of these future integrations are implemented in Stage 1.

### 2026-09-24 — Agent backbone and lightweight memory skeleton

Added the first model-agnostic Agent backbone. The UI now calls `CueSpaceAgent`, which reads scoped lightweight memory, invokes a `ModelGateway`, validates the returned ScenePatch, records a bounded temporary scene note, and only then applies the patch to the SceneGraph. Added a deterministic gateway adapter around the existing planner, so a hosted, free-tier, or local open-weight model can later implement the same asynchronous `plan(request)` contract without moving model code into the UI. Added `src/agent/memory.js`, `src/agent/gateway.js`, and `src/agent/harness.js`. The UI now exposes the active Agent, gateway/model, memory scopes, and patch-validation status. Stage 1 still uses the deterministic gateway; no external model or automatic permanent user-preference writes were added. JavaScript syntax checks and `git diff --check` pass.

### 2026-09-24 — Model evaluation direction

Recorded a tentative open-weight evaluation shortlist: Qwen3 instruct variants, Mistral Small 3.1, and Gemma 3. The shortlist is not a final selection. CueSpace should begin with one core model that reliably produces structured ScenePatch proposals; a separate reasoning model is deferred until measured failures justify it. Evaluation will focus on patch validity, preservation of user edits, ambiguity handling, memory scope isolation, latency, hardware requirements, and cost rather than image-generation quality. Official model documentation was reviewed for tool/function-calling and multimodal capability; project-specific tests remain required.

### 2026-09-24 — Harness policy, observability, and evaluation skeleton

Added explicit runtime policy and measurement scaffolding. The Agent now supports a bounded turn count and clarification count, model timeout handling, optional deterministic fallback gateway, cloned model inputs, patch base-version conflict rejection, trace IDs, fallback/latency metadata, and bounded local telemetry in `src/agent/observability.js`. Added repeatable smoke cases and aggregate metrics in `src/agent/evaluation.js` for patch validity, expected behavior, pass rate, and duration. This is operational observability and contract evaluation, not chain-of-thought logging. Qwen remains a viable core-model candidate, but no real model has been selected or connected yet.

### 2026-09-24 — Two-role planning backbone

Added the `DesignPlan` intermediate layer and a two-pass gateway boundary. The initial recommendation is one Qwen model used in two logical roles: Core for input observation/intent and Reasoning for spatial consolidation. The current deterministic gateway simulates both roles and returns layout, spatial relations, lighting plan, constraints, and proposed operation count before the existing ScenePatch validation. The gateway records `modelRoles` and `modelCount`, making a future split into separate core and reasoning models a replaceable routing decision. No second model is deployed yet.

### 2026-09-24 — Spatial validation and deployment placeholder

Added the first deterministic spatial validation layer in `src/agent/spatial-validator.js`. The harness now checks movable-object stage bounds, excessive overlap, and light target existence before accepting a ScenePatch. Structural stage elements are excluded from generic blocking-overlap checks. Clarified in the design record that SceneGraph is structured canonical state and renderer output/export is separate. Added `docs/DEPLOYMENT.md` with local SQLite/FastAPI and future cloud PostgreSQL/object-storage placeholders. Simplified the Stage 1 evaluation strategy to contract tests, a small scenario fixture set, and human spot checks.
