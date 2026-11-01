from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

import numpy as np

from anti_spoof import AntiSpoof, analysed_area_fits
from faces import FacePipeline, interocular_distance, yaw_offset

LIVENESS_CHALLENGES = ("turnLeft", "turnRight", "closer")
TURN_SIGN = {"turnLeft": 1.0, "turnRight": -1.0}


@dataclass(frozen=True)
class LivenessRules:
    min_turn_delta: float = 0.15
    min_closer_ratio: float = 1.10
    min_same_person_similarity: float = 0.25
    min_counted_face_ratio: float = 0.01
    min_real_probability: float = 0.2


RULES = LivenessRules()


@dataclass(frozen=True)
class PoseReading:
    faces: int
    yaw_offset: Optional[float]
    similarity: Optional[float]
    interocular_px: Optional[float] = None
    real_probability: Optional[float] = None


def movement_done(challenge: str, selfie: PoseReading, frame: PoseReading, rules: LivenessRules) -> bool:
    if challenge == "closer":
        reference_distance = selfie.interocular_px or 0.0
        return (
            reference_distance > 0
            and (frame.interocular_px or 0.0) / reference_distance >= rules.min_closer_ratio
        )
    delta = ((frame.yaw_offset or 0.0) - (selfie.yaw_offset or 0.0)) * TURN_SIGN[challenge]
    return delta >= rules.min_turn_delta


def evaluate_liveness(
    selfie: PoseReading, frames: list[tuple[str, PoseReading]], rules: LivenessRules = RULES
) -> list[str]:
    if selfie.faces != 1 or selfie.yaw_offset is None:
        return ["livenessFaceNotFound"]
    for _, frame in frames:
        if frame.faces != 1 or frame.yaw_offset is None:
            return ["livenessFaceNotFound"]
    for _, frame in frames:
        if frame.similarity is None or frame.similarity < rules.min_same_person_similarity:
            return ["livenessDifferentPerson"]
    for challenge, frame in frames:
        if not movement_done(challenge, selfie, frame, rules):
            return ["livenessNotCloser" if challenge == "closer" else "livenessNotTurned"]
    for _, frame in frames:
        if frame.real_probability is not None and frame.real_probability < rules.min_real_probability:
            return ["livenessSpoofSuspected"]
    return []


class LivenessVerifier:
    def __init__(
        self,
        pipeline: FacePipeline,
        anti_spoof: Optional[AntiSpoof] = None,
        rules: LivenessRules = RULES,
    ) -> None:
        self._pipeline = pipeline
        self._anti_spoof = anti_spoof
        self._rules = rules

    def proximity(self, selfie: Optional[np.ndarray], image: Optional[np.ndarray]) -> dict[str, Any]:
        reference = self._distance_pose(selfie)
        current = self._distance_pose(image)
        if (
            reference.faces != 1 or current.faces != 1
            or not reference.interocular_px or not current.interocular_px
        ):
            return {"ready": False, "closerRatio": None}
        return {
            "ready": movement_done("closer", reference, current, self._rules),
            "closerRatio": round(current.interocular_px / reference.interocular_px, 3),
        }

    def _distance_pose(self, image: Optional[np.ndarray]) -> PoseReading:
        if image is None:
            return PoseReading(0, None, None)
        detected = self._pipeline.detect(image)
        area = float(detected.image.shape[0] * detected.image.shape[1])
        faces = [
            face for face in detected.faces
            if float(face[2] * face[3]) / area >= self._rules.min_counted_face_ratio
        ]
        if len(faces) != 1:
            return PoseReading(len(faces), None, None)
        return PoseReading(1, None, None, interocular_px=interocular_distance(faces[0]) / detected.scale)

    def verify(
        self, selfie: Optional[np.ndarray], frames: list[tuple[str, Optional[np.ndarray]]]
    ) -> dict[str, Any]:
        selfie_pose, selfie_feature = self._read(selfie, None)
        frame_poses = [
            (challenge, self._read(image, selfie_feature, close_up=challenge == "closer")[0])
            for challenge, image in frames
        ]
        issues = evaluate_liveness(selfie_pose, frame_poses, self._rules)
        scores = [pose.real_probability for _, pose in frame_poses if pose.real_probability is not None]
        return {
            "passed": not issues,
            "issues": issues,
            "limits": {
                "minTurnDelta": self._rules.min_turn_delta,
                "minCloserRatio": self._rules.min_closer_ratio,
                "minSamePersonSimilarity": self._rules.min_same_person_similarity,
                "minRealProbability": self._rules.min_real_probability,
            },
            "liveScore": round(min(scores), 3) if scores else None,
            "frames": [
                {
                    "challenge": challenge,
                    "yawDelta": None
                    if pose.yaw_offset is None or selfie_pose.yaw_offset is None or challenge == "closer"
                    else round((pose.yaw_offset - selfie_pose.yaw_offset) * TURN_SIGN[challenge], 3),
                    "closerRatio": None
                    if challenge != "closer" or not pose.interocular_px or not selfie_pose.interocular_px
                    else round(pose.interocular_px / selfie_pose.interocular_px, 3),
                    "similarity": None if pose.similarity is None else round(pose.similarity, 3),
                    "realProbability": None
                    if pose.real_probability is None
                    else round(pose.real_probability, 3),
                }
                for challenge, pose in frame_poses
            ],
        }

    def _read(
        self, image: Optional[np.ndarray], reference: Optional[np.ndarray], close_up: bool = False
    ) -> tuple[PoseReading, Optional[np.ndarray]]:
        if image is None:
            return PoseReading(0, None, None), None
        detected = self._pipeline.detect(image)
        height, width = detected.image.shape[:2]
        area = float(width * height)
        counted = [
            face
            for face in detected.faces
            if float(face[2] * face[3]) / area >= self._rules.min_counted_face_ratio
        ]
        if len(counted) != 1:
            return PoseReading(len(counted), None, None), None
        face = counted[0]
        feature = self._pipeline.embed(detected.image, face)
        similarity = None if reference is None else self._pipeline.similarity(reference, feature)
        real_probability = None
        box = tuple(float(value) / detected.scale for value in face[:4])
        too_close_to_judge = close_up and not analysed_area_fits(image.shape[1], image.shape[0], box)
        if self._anti_spoof is not None and not too_close_to_judge:
            real_probability = self._anti_spoof.real_probability(image, box)
        return (
            PoseReading(
                faces=1,
                yaw_offset=yaw_offset(face),
                similarity=similarity,
                interocular_px=interocular_distance(face) / detected.scale,
                real_probability=real_probability,
            ),
            feature,
        )
