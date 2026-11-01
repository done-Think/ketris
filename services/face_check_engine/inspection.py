from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

import cv2
import numpy as np

from anti_spoof import AntiSpoof
from faces import FacePipeline, interocular_distance
from document_reading import (
    CARD_ASPECT_RANGE,
    card_candidates,
    crop_card,
    summarize_document,
)
from document_orientation import orient_document, read_document_regions, text_orientation_score
from text_regions import TextDetector, TextReader

PHOTO_KINDS = ("front", "back", "selfie")
SHARPNESS_SIDE_PX = 800
DHASH_SIZE = 16


@dataclass(frozen=True)
class InspectionRules:
    min_short_side_px: int = 480
    min_brightness: float = 40.0
    max_brightness: float = 225.0
    min_sharpness: float = 20.0
    min_counted_face_ratio: float = 0.01
    document_max_face_ratio: float = 0.06
    selfie_min_face_ratio: float = 0.04
    selfie_min_interocular_px: float = 40.0
    document_min_text_regions: int = 3
    selfie_max_text_regions: int = 8
    selfie_min_real_probability: float = 0.2
    document_evidence_min_text_regions: int = 8


RULES = InspectionRules()


def rule_limits(kind: str, rules: InspectionRules = RULES) -> dict[str, float]:
    common = {
        "minShortSidePx": rules.min_short_side_px,
        "minBrightness": rules.min_brightness,
        "maxBrightness": rules.max_brightness,
        "minSharpness": rules.min_sharpness,
    }
    if kind == "selfie":
        return {
            **common,
            "minFaceRatio": rules.selfie_min_face_ratio,
            "minInterocularPx": rules.selfie_min_interocular_px,
            "maxTextRegions": rules.selfie_max_text_regions,
            "minRealProbability": rules.selfie_min_real_probability,
        }
    return {
        **common,
        "maxFaceRatio": rules.document_max_face_ratio,
        "minTextRegions": rules.document_min_text_regions,
    }


@dataclass(frozen=True)
class FaceBox:
    area_ratio: float
    interocular_px: float
    box: tuple[float, float, float, float] = (0.0, 0.0, 0.0, 0.0)


@dataclass
class PhotoMetrics:
    opened: bool
    width: int = 0
    height: int = 0
    brightness: float = 0.0
    sharpness: float = 0.0
    faces: list[FaceBox] = field(default_factory=list)
    text_regions: int = 0
    real_probability: Optional[float] = None
    brightness_source: str = "image"


def evaluate(kind: str, metrics: PhotoMetrics, rules: InspectionRules = RULES) -> list[str]:
    if not metrics.opened:
        return ["unreadable"]

    issues: list[str] = []
    if min(metrics.width, metrics.height) < rules.min_short_side_px:
        issues.append("lowResolution")
    if metrics.brightness < rules.min_brightness:
        issues.append("tooDark")
    elif metrics.brightness > rules.max_brightness:
        issues.append("tooBright")
    if metrics.sharpness < rules.min_sharpness:
        issues.append("blurry")
    return issues + content_issues(kind, metrics, rules)


def content_issues(kind: str, metrics: PhotoMetrics, rules: InspectionRules) -> list[str]:
    if kind == "selfie":
        face_issues = selfie_face_issues(metrics, rules)
        if face_issues:
            return face_issues
        if metrics.text_regions >= rules.selfie_max_text_regions:
            return ["looksLikeDocument"]
        if (
            metrics.real_probability is not None
            and metrics.real_probability < rules.selfie_min_real_probability
        ):
            return ["spoofSuspected"]
        return []

    largest = max((face.area_ratio for face in metrics.faces), default=0.0)
    if kind == "front" and not metrics.faces:
        return ["documentFaceNotFound"]
    if largest > rules.document_max_face_ratio:
        return ["looksLikeSelfie"]
    if metrics.text_regions < rules.document_min_text_regions:
        return ["documentTextNotFound"]
    return []


def selfie_face_issues(metrics: PhotoMetrics, rules: InspectionRules) -> list[str]:
    if not metrics.faces:
        return ["selfieFaceNotFound"]
    counted = counted_faces(metrics.faces, rules)
    if not counted:
        return ["faceTooSmall"]
    if len(counted) > 1:
        return ["multipleFaces"]
    face = counted[0]
    too_small = (
        face.area_ratio < rules.selfie_min_face_ratio
        or face.interocular_px < rules.selfie_min_interocular_px
    )
    return ["faceTooSmall"] if too_small else []


def document_evidence(
    kind: str,
    metrics: PhotoMetrics,
    document_type: Optional[str],
    labels: int = 0,
    rules: InspectionRules = RULES,
) -> bool:
    if document_type is not None or labels >= 1:
        return True
    enough_text = metrics.text_regions >= rules.document_evidence_min_text_regions
    return enough_text and (kind == "back" or bool(metrics.faces))


def dhash(gray: np.ndarray) -> str:
    small = cv2.resize(gray, (DHASH_SIZE + 1, DHASH_SIZE), interpolation=cv2.INTER_AREA)
    bits = (small[:, 1:] > small[:, :-1]).flatten()
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return f"{value:0{DHASH_SIZE * DHASH_SIZE // 4}x}"


def sharpness_of(gray: np.ndarray) -> float:
    longest = max(gray.shape[:2])
    scale = min(1.0, SHARPNESS_SIDE_PX / longest)
    resized = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    return float(cv2.Laplacian(resized, cv2.CV_64F).var())


def counted_faces(faces: list[FaceBox], rules: InspectionRules = RULES) -> list[FaceBox]:
    return [face for face in faces if face.area_ratio >= rules.min_counted_face_ratio]


def document_brightness(image: np.ndarray, boxes: list[np.ndarray]) -> float:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if len(boxes) < RULES.document_min_text_regions:
        return float(gray.mean())
    mask = np.zeros_like(gray)
    for box in boxes:
        cv2.fillConvexPoly(mask, np.round(box).astype(np.int32), 255)
    return float(cv2.mean(gray, mask=mask)[0]) if np.any(mask) else float(gray.mean())


class PhotoInspector:
    def __init__(
        self,
        pipeline: FacePipeline,
        text_detector: Optional[TextDetector],
        anti_spoof: Optional[AntiSpoof] = None,
        text_reader: Optional[TextReader] = None,
    ) -> None:
        self._pipeline = pipeline
        self._text_detector = text_detector
        self._anti_spoof = anti_spoof
        self._text_reader = text_reader

    def orient_document(self, image: Optional[np.ndarray]) -> Optional[np.ndarray]:
        if self._text_detector is None or self._text_reader is None:
            return image
        if image is None:
            return None
        # In an open RG the portrait can be upright while the data panel is
        # sideways. Keep face inspection/matching in the portrait's orientation;
        # OCR independently rotates the printed panels below.
        best = None
        best_confidence = -1.0
        for rotation in (None, cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_180, cv2.ROTATE_90_COUNTERCLOCKWISE):
            candidate = image if rotation is None else cv2.rotate(image, rotation)
            faces = self._pipeline.detect(candidate).faces
            confidence = max((float(face[-1]) for face in faces), default=-1.0)
            if confidence > best_confidence:
                best, best_confidence = candidate, confidence
        return best if best is not None else orient_document(image, self._text_detector, self._text_reader)

    def document_view(self, image: Optional[np.ndarray]) -> Optional[np.ndarray]:
        oriented = self.orient_document(image)
        if oriented is None:
            return None
        corners = self._document_corners(oriented)
        return oriented if corners is None else crop_card(oriented, corners)

    def _document_corners(self, image: np.ndarray) -> Optional[np.ndarray]:
        candidates = card_candidates(image)
        if not candidates:
            return None
        if self._text_detector is None:
            return candidates[0]
        boxes = self._text_detector.boxes(image)
        detected = self._pipeline.detect(image)
        face_corners = [
            ((float(face[0]) + float(face[2]) * x) / detected.scale,
             (float(face[1]) + float(face[3]) * y) / detected.scale)
            for face in detected.faces
            for x, y in ((0, 0), (1, 0), (1, 1), (0, 1))
        ]
        aspect = max(image.shape[:2]) / min(image.shape[:2])
        required_text = min(len(boxes), RULES.document_min_text_regions)
        if CARD_ASPECT_RANGE[0] <= aspect <= CARD_ASPECT_RANGE[1]:
            required_text = max(required_text, int(np.ceil(0.8 * len(boxes))))
        for corners in candidates:
            if any(cv2.pointPolygonTest(corners, point, False) < 0 for point in face_corners):
                continue
            contained = sum(
                cv2.pointPolygonTest(corners, tuple(float(value) for value in box.mean(axis=0)), False) >= 0
                for box in boxes
            )
            if contained >= required_text:
                return corners
        return None

    def inspect(
        self,
        image: Optional[np.ndarray],
        kind: str,
        expected_name: Optional[str] = None,
        expected_cpf: Optional[str] = None,
    ) -> dict[str, Any]:
        if image is None:
            return {
                "issues": evaluate(kind, PhotoMetrics(opened=False)),
                "hashes": [],
                "liveScore": None,
                "document": None,
                "metrics": None,
            }
        card = None
        card_share = 1.0
        if kind != "selfie":
            image = self.orient_document(image)
            corners = self._document_corners(image)
            if corners is not None:
                card = crop_card(image, corners)
                card_share = cv2.contourArea(corners) / float(image.shape[0] * image.shape[1])
        metrics, hashes, boxes = self._measure(image, kind, card, card_share)
        document = None
        if kind != "selfie" and self._text_reader is not None:
            source = image if card is None else card
            reading = read_document_regions(
                image, self._text_detector, self._text_reader, card is not None, source, boxes, corners,
            )
            if not reading.card_detected:
                labels = text_orientation_score(reading.rows)[1]
                reading.card_detected = document_evidence(kind, metrics, reading.document_type, labels)
            document = summarize_document(reading, expected_name, expected_cpf)
        return {
            "issues": evaluate(kind, metrics),
            "hashes": hashes,
            "document": document,
            "liveScore": None
            if metrics.real_probability is None
            else round(metrics.real_probability, 3),
            "limits": rule_limits(kind),
            "metrics": {
                "width": metrics.width,
                "height": metrics.height,
                "brightness": round(metrics.brightness, 1),
                "brightnessSource": metrics.brightness_source,
                "sharpness": round(metrics.sharpness, 1),
                "textRegions": metrics.text_regions,
                "realProbability": None
                if metrics.real_probability is None
                else round(metrics.real_probability, 3),
                "faces": [
                    {
                        "areaRatio": round(face.area_ratio, 4),
                        "interocularPx": round(face.interocular_px, 1),
                    }
                    for face in metrics.faces
                ],
            },
        }

    def _measure(
        self,
        image: np.ndarray,
        kind: str,
        card: Optional[np.ndarray] = None,
        card_share: float = 1.0,
    ) -> tuple[PhotoMetrics, list[str], list[np.ndarray]]:
        height, width = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        source = image if card is None else card
        detected = self._pipeline.detect(source)
        resized_height, resized_width = detected.image.shape[:2]
        resized_area = float(resized_width * resized_height) / card_share
        faces = [
            FaceBox(
                area_ratio=float(face[2] * face[3]) / resized_area,
                interocular_px=interocular_distance(face) / detected.scale,
                box=tuple(float(value) / detected.scale for value in face[:4]),
            )
            for face in detected.faces
        ]
        real_probability = None
        selfie_faces = counted_faces(faces)
        if kind == "selfie" and self._anti_spoof and len(selfie_faces) == 1:
            real_probability = self._anti_spoof.real_probability(image, selfie_faces[0].box)
        boxes = self._text_detector.boxes(source) if self._text_detector else []
        metrics = PhotoMetrics(
            opened=True,
            width=width,
            height=height,
            brightness=float(gray.mean()) if kind == "selfie" else document_brightness(source, boxes),
            brightness_source="text" if kind != "selfie" and len(boxes) >= RULES.document_min_text_regions else "image",
            sharpness=sharpness_of(gray),
            faces=faces,
            text_regions=len(boxes),
            real_probability=real_probability,
        )
        return metrics, [dhash(gray), dhash(cv2.flip(gray, 1))], boxes
