from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

PATCH_SIZE = 80
REAL_CLASS = 1
MODELS = (("MiniFASNetV2.onnx", 2.7), ("MiniFASNetV1SE.onnx", 4.0))


def expanded_box(
    image_width: int, image_height: int, box: tuple[float, float, float, float], scale: float
) -> tuple[int, int, int, int]:
    x, y, width, height = box
    scale = min((image_height - 1) / height, (image_width - 1) / width, scale)
    new_width, new_height = width * scale, height * scale
    center_x, center_y = x + width / 2, y + height / 2
    left, top = center_x - new_width / 2, center_y - new_height / 2
    right, bottom = center_x + new_width / 2, center_y + new_height / 2
    if left < 0:
        right -= left
        left = 0
    if top < 0:
        bottom -= top
        top = 0
    if right > image_width - 1:
        left -= right - image_width + 1
        right = image_width - 1
    if bottom > image_height - 1:
        top -= bottom - image_height + 1
        bottom = image_height - 1
    return int(left), int(top), int(right), int(bottom)


def analysed_area_fits(
    image_width: int, image_height: int, box: tuple[float, float, float, float]
) -> bool:
    _, _, width, height = box
    if width <= 0 or height <= 0:
        return False
    room = min((image_height - 1) / height, (image_width - 1) / width)
    return all(scale <= room for _, scale in MODELS)


def softmax(values: np.ndarray) -> np.ndarray:
    shifted = np.exp(values - values.max())
    return shifted / shifted.sum()


class AntiSpoof:
    def __init__(self, models_dir: Path) -> None:
        self._nets = [
            (cv2.dnn.readNetFromONNX(np.frombuffer((models_dir / name).read_bytes(), dtype=np.uint8)), scale)
            for name, scale in MODELS
        ]

    def real_probability(
        self, image: np.ndarray, box: tuple[float, float, float, float]
    ) -> float:
        height, width = image.shape[:2]
        total = np.zeros(3, dtype=np.float64)
        for net, scale in self._nets:
            left, top, right, bottom = expanded_box(width, height, box, scale)
            patch = cv2.resize(image[top : bottom + 1, left : right + 1], (PATCH_SIZE, PATCH_SIZE))
            net.setInput(patch.transpose(2, 0, 1)[None].astype(np.float32))
            total += softmax(net.forward()[0])
        return float(total[REAL_CLASS] / len(self._nets))
