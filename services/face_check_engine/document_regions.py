"""Suggest document regions for human review; never approve an identity."""
from __future__ import annotations

import cv2
import numpy as np

from document_reading import card_candidates


def document_regions(image: np.ndarray) -> list[dict[str, float]]:
    height, width = image.shape[:2]
    regions: list[dict[str, float]] = []
    for polygon in card_candidates(image, min_area_ratio=0.015, max_side=1200):
        x, y, w, h = cv2.boundingRect(polygon)
        regions.append({
            "x": x / width, "y": y / height,
            "width": min(w, width - x) / width,
            "height": min(h, height - y) / height,
        })
        if len(regions) >= 8:
            break
    return sorted(regions, key=lambda region: (round(region["y"], 1), region["x"]))
