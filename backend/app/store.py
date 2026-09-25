from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .default_scene import create_default_scene


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store:
    """Small SQLite persistence layer; the SceneGraph remains JSON, not an image."""

    def __init__(self, database_path: str | Path) -> None:
        self.path = str(database_path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self._init_database()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_database(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS projects (
                  id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS scenes (
                  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
                  version INTEGER NOT NULL, scene_json TEXT NOT NULL,
                  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS scene_versions (
                  id TEXT PRIMARY KEY, scene_id TEXT NOT NULL, version INTEGER NOT NULL,
                  label TEXT, source TEXT NOT NULL, scene_json TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS memory_entries (
                  id TEXT PRIMARY KEY, scope TEXT NOT NULL, owner_id TEXT NOT NULL,
                  text TEXT NOT NULL, metadata_json TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS agent_runs (
                  id TEXT PRIMARY KEY, scene_id TEXT NOT NULL, request_text TEXT NOT NULL,
                  intent_json TEXT NOT NULL, design_plan_json TEXT NOT NULL,
                  patch_json TEXT NOT NULL, trace_json TEXT NOT NULL, status TEXT NOT NULL,
                  created_at TEXT NOT NULL
                );
                """
            )
            connection.execute(
                "INSERT OR IGNORE INTO projects (id, title, created_at) VALUES (?, ?, ?)",
                ("default-project", "CueSpace studies", _now()),
            )

    def create_scene(self, project_id: str, title: str) -> Dict[str, Any]:
        scene_id = f"scene-{uuid.uuid4().hex[:12]}"
        now = _now()
        scene = create_default_scene(scene_id)
        with self._connect() as connection:
            connection.execute("INSERT OR IGNORE INTO projects (id, title, created_at) VALUES (?, ?, ?)", (project_id, project_id, now))
            connection.execute(
                "INSERT INTO scenes VALUES (?, ?, ?, ?, ?, ?, ?)",
                (scene_id, project_id, title, scene["version"], json.dumps(scene), now, now),
            )
            self._append_version(connection, scene_id, scene, "Initial stage template", "create")
        return {"scene": scene, "project_id": project_id, "title": title}

    def get_scene(self, scene_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM scenes WHERE id = ?", (scene_id,)).fetchone()
        if not row:
            return None
        return {"scene": json.loads(row["scene_json"]), "project_id": row["project_id"], "title": row["title"]}

    def update_scene(self, scene_id: str, scene: Dict[str, Any], expected_version: int, source: str, label: Optional[str] = None) -> Dict[str, Any]:
        now = _now()
        with self._connect() as connection:
            current = connection.execute("SELECT * FROM scenes WHERE id = ?", (scene_id,)).fetchone()
            if not current:
                raise KeyError(scene_id)
            if current["version"] != expected_version:
                raise ValueError(f"Version conflict: current is {current['version']}")
            connection.execute(
                "UPDATE scenes SET version = ?, scene_json = ?, updated_at = ? WHERE id = ?",
                (scene["version"], json.dumps(scene), now, scene_id),
            )
            self._append_version(connection, scene_id, scene, label or source, source)
            return {"scene": scene, "project_id": current["project_id"], "title": current["title"]}

    def snapshot(self, scene_id: str, label: Optional[str]) -> None:
        record = self.get_scene(scene_id)
        if not record:
            raise KeyError(scene_id)
        with self._connect() as connection:
            self._append_version(connection, scene_id, record["scene"], label or "Manual snapshot", "snapshot")

    def _append_version(self, connection: sqlite3.Connection, scene_id: str, scene: Dict[str, Any], label: str, source: str) -> None:
        connection.execute(
            "INSERT INTO scene_versions VALUES (?, ?, ?, ?, ?, ?, ?)",
            (f"version-{uuid.uuid4().hex[:12]}", scene_id, scene["version"], label, source, json.dumps(scene), _now()),
        )

    def add_memory(self, scope: str, owner_id: str, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO memory_entries VALUES (?, ?, ?, ?, ?, ?)",
                (f"memory-{uuid.uuid4().hex[:12]}", scope, owner_id, text, json.dumps(metadata or {}), _now()),
            )

    def memory_context(self, scene_id: str, project_id: str) -> List[Dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT scope, text, metadata_json FROM memory_entries WHERE (scope = 'scene' AND owner_id = ?) OR (scope = 'project' AND owner_id = ?) ORDER BY created_at DESC LIMIT 12",
                (scene_id, project_id),
            ).fetchall()
        return [{"scope": row["scope"], "text": row["text"], "metadata": json.loads(row["metadata_json"])} for row in rows]

    def save_run(self, run: Dict[str, Any]) -> None:
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO agent_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (run["run_id"], run["scene_id"], run["request_text"], json.dumps(run["intent"]), json.dumps(run["design_plan"]), json.dumps(run["patch"]), json.dumps(run["trace"]), run["status"], _now()),
            )

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM agent_runs WHERE id = ?", (run_id,)).fetchone()
        if not row:
            return None
        return {"run_id": row["id"], "scene_id": row["scene_id"], "request_text": row["request_text"], "intent": json.loads(row["intent_json"]), "design_plan": json.loads(row["design_plan_json"]), "patch": json.loads(row["patch_json"]), "trace": json.loads(row["trace_json"]), "status": row["status"]}
