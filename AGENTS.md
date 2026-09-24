# CueSpace working conventions

Read `PRD.md`, `README.md`, `docs/DESIGN.md`, and `AGENT_PROGRESS.md` before making changes.

Keep the product boundary explicit: CueSpace is an accessible 2D/2.5D stage-design sandbox, not a professional theatre CAD system or a general image-generation product.

Preserve the separation between:

- input understanding and design intent;
- the structured, editable `SceneGraph`;
- deterministic rendering;
- user edits and version history;
- optional model or external-service integrations.

Do not treat generated images as the canonical scene state. User edits must take precedence over model inferences. Model output must be validated before it changes a scene, and ambiguous input must either use a visible reversible default or produce a focused clarification question.

Keep mocks, fallbacks, and real integrations clearly labeled. Never commit API keys, private uploads, or unlicensed assets.

Run relevant frontend, backend, schema, and browser checks for changed behavior. Update `README.md` for user-visible changes, `docs/DESIGN.md` for confirmed architectural decisions, and `AGENT_PROGRESS.md` after every meaningful change set and before stopping. Do not claim checks that were not run.
