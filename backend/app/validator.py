from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List


ALLOWED_OPERATIONS = {"update_object", "update_light", "add_object", "add_light", "update_background", "update_environment"}
STRUCTURAL_TYPES = {"wall", "floor", "scrim", "curtain", "rug"}


def apply_patch(scene: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    next_scene = deepcopy(scene)
    for operation in patch.get("operations", []):
        op = operation["op"]
        if op == "update_object":
            target = next((item for item in next_scene["objects"] if item["id"] == operation["id"]), None)
            if target:
                target.update(operation["changes"])
        elif op == "update_light":
            target = next((item for item in next_scene["lights"] if item["id"] == operation["id"]), None)
            if target:
                target.update(operation["changes"])
        elif op == "add_object":
            next_scene["objects"].append(operation["object"])
        elif op == "add_light":
            next_scene["lights"].append(operation["light"])
        elif op == "update_background":
            next_scene["background"].update(operation["changes"])
        elif op == "update_environment":
            next_scene["environment"].update(operation["changes"])
    next_scene["version"] = scene["version"] + 1
    return next_scene


def _bounds(item: Dict[str, Any]) -> Dict[str, float]:
    width = float(item.get("width", 0))
    height = float(item.get("height", 0))
    return {"left": float(item.get("x", 0)) - width / 2, "right": float(item.get("x", 0)) + width / 2, "top": float(item.get("y", 0)) - height / 2, "bottom": float(item.get("y", 0)) + height / 2, "width": width, "height": height}


def validate_scene(scene: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    objects = scene.get("objects", [])
    object_ids = [item.get("id") for item in objects]
    if len(object_ids) != len(set(object_ids)):
        errors.append("Scene has duplicate object IDs")
    movable = [item for item in objects if not item.get("locked") and item.get("type") not in STRUCTURAL_TYPES and item.get("type") != "window"]
    for item in movable:
        box = _bounds(item)
        if box["width"] <= 0 or box["height"] <= 0:
            errors.append(f"Object has invalid dimensions: {item.get('id')}")
        if box["left"] < 0 or box["right"] > 1 or box["top"] < 0 or box["bottom"] > 1:
            errors.append(f"Object outside stage bounds: {item.get('id')}")
    for index, first in enumerate(movable):
        for second in movable[index + 1:]:
            a, b = _bounds(first), _bounds(second)
            overlap_width = max(0.0, min(a["right"], b["right"]) - max(a["left"], b["left"]))
            overlap_height = max(0.0, min(a["bottom"], b["bottom"]) - max(a["top"], b["top"]))
            overlap = overlap_width * overlap_height
            smaller = min(a["width"] * a["height"], b["width"] * b["height"])
            if smaller > 0 and overlap / smaller > 0.45:
                errors.append(f"Objects overlap too much: {first.get('id')} and {second.get('id')}")
    object_id_set = set(object_ids)
    for light in scene.get("lights", []):
        for target_id in light.get("targetIds", []):
            if target_id not in object_id_set:
                errors.append(f"Light target does not exist: {light.get('id')} -> {target_id}")
    return errors


def validate_patch(scene: Dict[str, Any], patch: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    if patch.get("baseVersion") != scene.get("version"):
        errors.append(f"Scene version conflict: expected {scene.get('version')}, received {patch.get('baseVersion')}")
    object_ids = {item["id"] for item in scene.get("objects", [])}
    light_ids = {item["id"] for item in scene.get("lights", [])}
    for operation in patch.get("operations", []):
        op = operation.get("op")
        if op not in ALLOWED_OPERATIONS:
            errors.append(f"Unsupported operation: {op}")
        elif op == "update_object" and operation.get("id") not in object_ids:
            errors.append(f"Unknown object: {operation.get('id')}")
        elif op == "update_light" and operation.get("id") not in light_ids:
            errors.append(f"Unknown light: {operation.get('id')}")
        elif op == "add_object":
            payload = operation.get("object")
            if not payload or payload.get("id") in object_ids:
                errors.append("Invalid new object")
        elif op == "add_light":
            payload = operation.get("light")
            if not payload or payload.get("id") in light_ids:
                errors.append("Invalid new light")
    if not errors:
        errors.extend(validate_scene(apply_patch(scene, patch)))
    return errors
