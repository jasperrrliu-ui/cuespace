from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List

from .validator import validate_patch


def _has(text: str, *words: str) -> bool:
    return any(word in text.lower() for word in words)


class DeterministicCueSpaceAgent:
    """A transparent stand-in for the later hosted-model gateway."""

    name = "deterministic-two-pass-v1"

    def run(self, text: str, scene: Dict[str, Any], memory: List[Dict[str, Any]]) -> Dict[str, Any]:
        started = time.perf_counter()
        intent = self._core_pass(text, memory)
        design_plan, patch, assumptions = self._reasoning_pass(intent, scene)
        validation_errors = validate_patch(scene, patch)
        fallback = bool(validation_errors)
        if fallback:
            patch = {"baseVersion": scene["version"], "operations": []}
        run_id = f"run-{uuid.uuid4().hex[:12]}"
        trace = {
            "runId": run_id,
            "gateway": self.name,
            "model": "mock-planner-v1",
            "logicalPasses": ["core: input-to-design-intent", "reasoning: intent-to-plan-and-patch"],
            "memoryEntriesUsed": len(memory),
            "validation": {"level": [1, 2], "passed": not fallback, "errors": validation_errors},
            "fallback": fallback,
            "latencyMs": round((time.perf_counter() - started) * 1000, 2),
        }
        return {"run_id": run_id, "intent": intent, "design_plan": design_plan, "patch": patch, "assumptions": assumptions, "trace": trace, "status": "fallback" if fallback else "applied"}

    def _core_pass(self, text: str, memory: List[Dict[str, Any]]) -> Dict[str, Any]:
        lower = text.lower()
        setting = "new-york-apartment" if _has(lower, "apartment", "纽约", "new york") else "black-box-stage"
        palette = "monochrome" if _has(lower, "black", "white", "gray", "grey", "黑", "白", "灰") else "neutral"
        lighting = "night" if _has(lower, "night", "dark", "夜", "星") else "day"
        return {"rawText": text, "setting": setting, "mood": "controlled" if _has(lower, "organized", "order", "整齐", "克制") else "open", "palette": palette, "lightingCue": lighting, "focus": "table" if _has(lower, "table", "desk", "桌") else "whole-stage", "memoryHints": [item["text"] for item in memory[:3]]}

    def _reasoning_pass(self, intent: Dict[str, Any], scene: Dict[str, Any]) -> tuple[Dict[str, Any], Dict[str, Any], List[str]]:
        operations: List[Dict[str, Any]] = []
        assumptions: List[str] = []
        if intent["setting"] == "new-york-apartment":
            operations.extend([
                {"op": "update_environment", "changes": {"setting": "new-york-apartment", "style": "contemporary-apartment", "palette": intent["palette"]}},
                {"op": "update_object", "id": "table-01", "changes": {"label": "Compact dining table", "color": "#3f4248"}},
                {"op": "update_object", "id": "chair-01", "changes": {"label": "Apartment dining chair", "color": "#15171b"}},
                {"op": "add_object", "object": {"id": "sofa-01", "type": "sofa", "label": "Compact sofa", "x": 0.30, "y": 0.68, "width": 0.19, "height": 0.13, "z": 4, "color": "#dedede"}},
                {"op": "add_object", "object": {"id": "window-frame-01", "type": "window", "label": "Apartment window", "x": 0.72, "y": 0.32, "width": 0.18, "height": 0.22, "z": 3, "color": "#7c879a", "locked": True}},
            ])
            assumptions.append("The apartment is represented as a compact proscenium slice, not an architectural floor plan.")
        if intent["palette"] == "monochrome":
            operations.extend([
                {"op": "update_background", "changes": {"color": "#111318"}},
                {"op": "update_object", "id": "floor", "changes": {"color": "#35363a"}},
            ])
        if intent["lightingCue"] == "night":
            operations.extend([
                {"op": "update_light", "id": "ambient-01", "changes": {"color": "#18243e", "intensity": 0.34, "colorMix": 0.5}},
                {"op": "update_light", "id": "window-01", "changes": {"label": "Cool window night", "color": "#5f86ff", "intensity": 0.72, "colorMix": 0.68, "gobo": "window"}},
                {"op": "add_light", "light": {"id": "stars-01", "label": "Window star breakup", "role": "texture light", "type": "backlight", "color": "#a7c7ff", "intensity": 0.38, "colorMix": 0.28, "softness": 0.28, "beamWidth": 0.46, "gobo": "stars", "x": 0.76, "y": 0.19, "targetIds": ["back-wall"]}},
            ])
            assumptions.append("Night was inferred from the prompt; the window becomes a motivated cool source with a subtle star breakup.")
        plan = {"summary": f"{intent['setting']} / {intent['palette']} / {intent['lightingCue']}", "layout": "keep a readable central playing area", "spatialRelations": ["window-frame-01 is upstage-right of table-01"] if intent["setting"] == "new-york-apartment" else [], "lightingPlan": "motivated window source plus ambient and practical layers", "constraints": ["preserve a central playable area", "keep all movable objects on stage"], "rationale": "The planner turns broad mood into editable scene attributes; it does not claim a finished photoreal set design."}
        return plan, {"baseVersion": scene["version"], "operations": operations}, assumptions
