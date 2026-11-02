"""Transient face placement feedback; no recognition, storage or verification decision."""
from __future__ import annotations

import numpy as np


def face_framing(pipeline, image):
    height, width = image.shape[:2]
    detected = pipeline.detect(image)
    sample_height, sample_width = detected.image.shape[:2]
    faces = [face for face in detected.faces
             if np.isfinite(face[:4]).all() and face[2] > 0 and face[3] > 0]
    largest = max(faces, key=lambda face: face[2] * face[3], default=None)
    return {
        "width": width,
        "height": height,
        "faceCount": min(len(faces), 10),
        "face": None if largest is None else {
            "x": float(largest[0]) / sample_width,
            "y": float(largest[1]) / sample_height,
            "width": float(largest[2]) / sample_width,
            "height": float(largest[3]) / sample_height,
        },
    }
