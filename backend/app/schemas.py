from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CreateSceneRequest(BaseModel):
    project_id: str = "default-project"
    title: str = "Untitled stage study"


class AgentRunRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    expected_version: int


class DirectEditRequest(BaseModel):
    scene: Dict[str, Any]
    expected_version: int
    note: Optional[str] = Field(default=None, max_length=500)


class SaveVersionRequest(BaseModel):
    label: Optional[str] = Field(default=None, max_length=120)


class SceneResponse(BaseModel):
    scene: Dict[str, Any]
    project_id: str
    title: str


class AgentRunResponse(BaseModel):
    run_id: str
    scene: Dict[str, Any]
    intent: Dict[str, Any]
    design_plan: Dict[str, Any]
    patch: Dict[str, Any]
    assumptions: List[str]
    trace: Dict[str, Any]
