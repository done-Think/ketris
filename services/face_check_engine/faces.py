from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

RIGHT_EYE = slice(4, 6)
LEFT_EYE = slice(6, 8)
NOSE = slice(8, 10)
DETECTION_SCORE = 14
NMS_THRESHOLD = 0.3
TOP_K = 5000


@dataclass
class DetectedFaces:
    image: np.ndarray
    scale: float
    faces: list[np.ndarray]


def decode_image(data: bytes) -> Optional[np.ndarray]:
    buffer = np.frombuffer(data, dtype=np.uint8)
    # Ketris adaptation: malformed decoder input is a controlled request error.
    try:
        return cv2.imdecode(buffer, cv2.IMREAD_COLOR) if buffer.size else None
    except cv2.error:
        return None


def interocular_distance(face: np.ndarray) -> float:
    return float(np.linalg.norm(face[RIGHT_EYE] - face[LEFT_EYE]))


def yaw_offset(face: np.ndarray) -> float:
    eyes_mid_x = (face[RIGHT_EYE][0] + face[LEFT_EYE][0]) / 2
    eye_span = max(abs(face[LEFT_EYE][0] - face[RIGHT_EYE][0]), 1e-6)
    return float((face[NOSE][0] - eyes_mid_x) / eye_span)


@dataclass
class FaceReading:
    opened: bool
    faces_found: int
    detection_score: Optional[float]
    interocular_px: Optional[float]
    detect_ms: Optional[float]
    embed_ms: Optional[float]
    feature: Optional[np.ndarray]


class FacePipeline:
    def __init__(
        self, yunet_path: Path, sface_path: Path, score_threshold: float, max_side: int
    ) -> None:
        self._detector = cv2.FaceDetectorYN.create(
            "onnx", np.frombuffer(yunet_path.read_bytes(), dtype=np.uint8),
            np.empty(0, dtype=np.uint8), (320, 320), score_threshold, NMS_THRESHOLD, TOP_K
        )
        self._recognizer = cv2.FaceRecognizerSF.create(
            "onnx", np.frombuffer(sface_path.read_bytes(), dtype=np.uint8), np.empty(0, dtype=np.uint8)
        )
        self._max_side = max_side

    def read(self, image_path: Path) -> FaceReading:
        return self.read_image(cv2.imread(str(image_path), cv2.IMREAD_COLOR))

    def read_bytes(self, data: bytes) -> FaceReading:
        return self.read_image(decode_image(data))

    def detect(self, image: np.ndarray) -> DetectedFaces:
        resized, scale = self._limit_size(image)
        height, width = resized.shape[:2]
        self._detector.setInputSize((width, height))
        _, faces = self._detector.detect(resized)
        found = [] if faces is None else list(faces)
        return DetectedFaces(resized, scale, found)

    def read_image(self, image: Optional[np.ndarray]) -> FaceReading:
        if image is None:
            return FaceReading(False, 0, None, None, None, None, None)

        started = time.perf_counter()
        detected = self.detect(image)
        detect_ms = (time.perf_counter() - started) * 1000
        image, scale, faces = detected.image, detected.scale, detected.faces

        if not faces:
            return FaceReading(True, 0, None, None, detect_ms, None, None)

        face = max(faces, key=lambda candidate: candidate[2] * candidate[3])

        started = time.perf_counter()
        aligned = self._recognizer.alignCrop(image, face)
        feature = self._recognizer.feature(aligned).copy()
        embed_ms = (time.perf_counter() - started) * 1000

        interocular_px = interocular_distance(face) / scale
        return FaceReading(
            True,
            len(faces),
            float(face[DETECTION_SCORE]),
            interocular_px,
            detect_ms,
            embed_ms,
            feature,
        )

    def embed(self, image: np.ndarray, face: np.ndarray) -> np.ndarray:
        return self._recognizer.feature(self._recognizer.alignCrop(image, face)).copy()

    def similarity(self, first: np.ndarray, second: np.ndarray) -> float:
        return float(self._recognizer.match(first, second, cv2.FaceRecognizerSF_FR_COSINE))

    def _limit_size(self, image: np.ndarray) -> tuple[np.ndarray, float]:
        longest = max(image.shape[:2])
        if longest <= self._max_side:
            return image, 1.0
        scale = self._max_side / longest
        resized = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        return resized, scale
