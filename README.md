# CueSpace

An accessible AI-assisted stage-design sandbox for exploring stage composition and lighting without formal theatre-design or drawing training.

## Current status

The repository now contains the first **Stage 1 — demo/MVP** vertical slice. It is intentionally local and deterministic: no external model, image upload, or voice integration is required yet.

The demo lets a user describe a stage in text, receive an editable 2D/2.5D scene, move furniture and set pieces, adjust lighting, save versions, and revise the current scene through a small deterministic mock planner. The renderer includes stage framing, curtains, perspective floor lines, material gradients, shadows, scrim detail, and lighting beams. A small curated guidance module maps mood language to explainable lighting choices.

The canonical state will be a structured editable `SceneGraph`, not a generated image. Rendering will be deterministic application code; Agent behavior will be limited to interpreting intent and proposing validated scene changes.

## Repository guide

- [PRD.md](PRD.md) — product scope, staged roadmap, boundaries, and acceptance criteria.
- [AGENTS.md](AGENTS.md) — working conventions for implementation and handoff.
- [docs/DESIGN.md](docs/DESIGN.md) — confirmed and pending architecture decisions.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — implemented request flow, storage, validation, and model boundary.
- [AGENT_PROGRESS.md](AGENT_PROGRESS.md) — chronological implementation and design log.

## Planned roadmap

1. **Stage 0 — Foundation and confirmed design:** finalize data contracts and acceptance cases.
2. **Stage 1 — Demo/MVP:** text-to-editable 2D/2.5D scene, furniture movement, lighting controls, revisions, and versioning.
3. **Stage 2 — Multimodal reference input:** PNG/JPEG/WebP reference images with confidence and uncertainty handling.
4. **Stage 3 — Voice and learning assistance:** speech-to-text and curated stage-design guidance.
5. **Stage 4 — Controlled 3D migration:** add depth and limited 3D rendering while preserving the core SceneGraph and workflow.

## Run the deterministic UI only

Prerequisites: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The app stores the current scene and saved versions in browser `localStorage`; no server or API key is required.

If the local Windows environment reports a Vite `spawn EPERM` error, use the dependency-free static preview instead:

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

```bash
npm run build
```

The mock planner supports a small, explicit vocabulary for the demo, including warm/cool/blue lighting, bright/dim lighting, suspense/mystery mood, and moving the table left/right/center. Unsupported language is kept safe and visible as a planner note rather than silently changing the scene.

## Run the local backend (Stages 0–6)

The backend makes scene versions, lightweight scene memory, traces, and validation persistent in local SQLite. It still uses a deterministic two-pass planner; it does **not** call Qwen or any hosted API yet.

```powershell
.\.venv39\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv39\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```

In a second terminal, serve the UI at port 4173. It will display `FastAPI + SQLite connected` when the backend is available. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the exact data flow and what each stored record means.
