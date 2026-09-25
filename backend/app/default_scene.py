from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict


DEFAULT_SCENE: Dict[str, Any] = {
    "sceneId": "",
    "version": 1,
    "canvas": {"width": 1000, "height": 620},
    "environment": {"setting": "black_box", "style": "stage-study", "palette": "neutral"},
    "background": {"color": "#151922"},
    "objects": [
        {"id": "back-wall", "type": "wall", "label": "Back wall", "x": 0.5, "y": 0.28, "width": 0.86, "height": 0.42, "z": 0, "color": "#262b37", "locked": True},
        {"id": "floor", "type": "floor", "label": "Floor", "x": 0.5, "y": 0.74, "width": 0.86, "height": 0.28, "z": 1, "color": "#403a38", "locked": True},
        {"id": "scrim", "type": "scrim", "label": "Back scrim", "x": 0.5, "y": 0.42, "width": 0.55, "height": 0.36, "z": 2, "color": "#c4c8d0", "opacity": 0.18},
        {"id": "table-01", "type": "table", "label": "Old wooden table", "x": 0.5, "y": 0.68, "width": 0.22, "height": 0.12, "z": 3, "color": "#9b6847"},
        {"id": "chair-01", "type": "chair", "label": "Chair", "x": 0.69, "y": 0.69, "width": 0.1, "height": 0.15, "z": 4, "color": "#6f4b39"},
        {"id": "curtain-left", "type": "curtain", "label": "Left curtain", "x": 0.09, "y": 0.32, "width": 0.08, "height": 0.52, "z": 5, "color": "#171927", "locked": True},
        {"id": "curtain-right", "type": "curtain", "label": "Right curtain", "x": 0.91, "y": 0.32, "width": 0.08, "height": 0.52, "z": 5, "color": "#171927", "locked": True},
    ],
    "lights": [
        {"id": "ambient-01", "label": "Ambient wash", "role": "background light", "type": "ambient", "color": "#8892a8", "intensity": 0.18, "colorMix": 0.18, "softness": 1, "beamWidth": 1, "gobo": "none", "x": 0.5, "y": 0.35, "targetIds": []},
        {"id": "window-01", "label": "Window daylight", "role": "natural light", "type": "window", "color": "#9bb8ff", "intensity": 0.42, "colorMix": 0.24, "softness": 0.72, "beamWidth": 0.7, "gobo": "window", "x": 0.82, "y": 0.22, "targetIds": ["table-01"]},
        {"id": "ceiling-01", "label": "Ceiling practical", "role": "motivated light", "type": "practical", "color": "#f2c48f", "intensity": 0.28, "colorMix": 0.3, "softness": 0.62, "beamWidth": 0.5, "gobo": "none", "x": 0.52, "y": 0.16, "targetIds": ["table-01"]},
        {"id": "side-01", "label": "Left side light", "role": "shape light", "type": "side", "color": "#6e8cff", "intensity": 0.65, "colorMix": 0.46, "softness": 0.5, "beamWidth": 0.42, "gobo": "none", "x": 0.18, "y": 0.36, "targetIds": ["table-01"]},
        {"id": "fill-01", "label": "Soft fill", "role": "fill light", "type": "fill", "color": "#d6d9e9", "intensity": 0.22, "colorMix": 0.12, "softness": 0.9, "beamWidth": 0.85, "gobo": "none", "x": 0.72, "y": 0.48, "targetIds": ["table-01"]},
    ],
    "relations": [],
}


def create_default_scene(scene_id: str) -> Dict[str, Any]:
    scene = deepcopy(DEFAULT_SCENE)
    scene["sceneId"] = scene_id
    return scene
