from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .agent import DeterministicCueSpaceAgent
from .schemas import AgentRunRequest, AgentRunResponse, CreateSceneRequest, DirectEditRequest, SaveVersionRequest, SceneResponse
from .store import Store
from .validator import validate_scene


def create_app(database_path: str | None = None) -> FastAPI:
    root = Path(__file__).resolve().parents[2]
    store = Store(database_path or os.getenv("CUESPACE_DB", str(root / "data" / "cuespace.db")))
    agent = DeterministicCueSpaceAgent()
    app = FastAPI(title="CueSpace API", version="0.1.0")
    app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:4173", "http://localhost:4173"], allow_methods=["*"], allow_headers=["*"])

    def get_record(scene_id: str) -> Dict[str, Any]:
        record = store.get_scene(scene_id)
        if not record:
            raise HTTPException(status_code=404, detail="Scene not found")
        return record

    @app.get("/api/health")
    def health() -> Dict[str, str]:
        return {"status": "ok", "planner": agent.name, "storage": "sqlite"}

    @app.post("/api/scenes", response_model=SceneResponse, status_code=201)
    def create_scene(request: CreateSceneRequest) -> Dict[str, Any]:
        return store.create_scene(request.project_id, request.title)

    @app.get("/api/scenes/{scene_id}", response_model=SceneResponse)
    def read_scene(scene_id: str) -> Dict[str, Any]:
        return get_record(scene_id)

    @app.patch("/api/scenes/{scene_id}", response_model=SceneResponse)
    def direct_edit(scene_id: str, request: DirectEditRequest) -> Dict[str, Any]:
        record = get_record(scene_id)
        if request.scene.get("version") != request.expected_version + 1:
            raise HTTPException(status_code=422, detail="A direct edit must advance the scene by exactly one version")
        errors = validate_scene(request.scene)
        if errors:
            raise HTTPException(status_code=422, detail={"validationErrors": errors})
        try:
            updated = store.update_scene(scene_id, request.scene, request.expected_version, "manual-edit", request.note)
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        return updated

    @app.post("/api/scenes/{scene_id}/agent-runs", response_model=AgentRunResponse)
    def agent_run(scene_id: str, request: AgentRunRequest) -> Dict[str, Any]:
        record = get_record(scene_id)
        if record["scene"]["version"] != request.expected_version:
            raise HTTPException(status_code=409, detail=f"Version conflict: current is {record['scene']['version']}")
        memory = store.memory_context(scene_id, record["project_id"])
        result = agent.run(request.text, record["scene"], memory)
        if result["status"] == "applied" and result["patch"]["operations"]:
            from .validator import apply_patch
            next_scene = apply_patch(record["scene"], result["patch"])
            record = store.update_scene(scene_id, next_scene, request.expected_version, "agent", result["design_plan"]["summary"])
        store.add_memory("scene", scene_id, request.text, {"run_id": result["run_id"], "kind": "user-request"})
        store.save_run({**result, "scene_id": scene_id, "request_text": request.text})
        return {**result, "scene": record["scene"]}

    @app.post("/api/scenes/{scene_id}/versions")
    def save_version(scene_id: str, request: SaveVersionRequest) -> Dict[str, str]:
        get_record(scene_id)
        store.snapshot(scene_id, request.label)
        return {"status": "saved"}

    @app.get("/api/agent-runs/{run_id}")
    def read_agent_run(run_id: str) -> Dict[str, Any]:
        result = store.get_run(run_id)
        if not result:
            raise HTTPException(status_code=404, detail="Agent run not found")
        return result

    return app


app = create_app()
