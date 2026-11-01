import unittest

import numpy as np

from anti_spoof import analysed_area_fits
from faces import DetectedFaces, yaw_offset
from liveness import LivenessVerifier, PoseReading, evaluate_liveness

FRONTAL = PoseReading(faces=1, yaw_offset=0.02, similarity=None, interocular_px=80.0)


def turned(offset, similarity=0.6, faces=1, interocular=80.0, real=0.9):
    return PoseReading(
        faces=faces,
        yaw_offset=offset,
        similarity=similarity,
        interocular_px=interocular,
        real_probability=real,
    )


def face_with(nose_x, right_eye_x=40.0, left_eye_x=80.0):
    face = np.zeros(15, dtype=np.float32)
    face[4], face[6], face[8] = right_eye_x, left_eye_x, nose_x
    return face


class YawOffsetTest(unittest.TestCase):
    def test_is_zero_when_the_nose_sits_between_the_eyes(self):
        self.assertAlmostEqual(yaw_offset(face_with(nose_x=60.0)), 0.0)

    def test_grows_as_the_nose_moves_toward_one_side(self):
        self.assertAlmostEqual(yaw_offset(face_with(nose_x=72.0)), 0.3)
        self.assertAlmostEqual(yaw_offset(face_with(nose_x=48.0)), -0.3)


class EvaluateLivenessTest(unittest.TestCase):
    def test_passes_when_each_turn_goes_the_asked_way(self):
        frames = [("turnLeft", turned(0.35)), ("turnRight", turned(-0.3))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), [])

    def test_fails_when_the_head_does_not_turn(self):
        frames = [("turnLeft", turned(0.05)), ("turnRight", turned(-0.3))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), ["livenessNotTurned"])

    def test_fails_when_the_head_turns_the_wrong_way(self):
        frames = [("turnLeft", turned(-0.35)), ("turnRight", turned(0.3))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), ["livenessNotTurned"])

    def test_fails_when_another_person_appears(self):
        frames = [("turnLeft", turned(0.35, similarity=0.05)), ("turnRight", turned(-0.3))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), ["livenessDifferentPerson"])

    def test_fails_when_a_frame_has_no_single_face(self):
        frames = [("turnLeft", turned(None, faces=0)), ("turnRight", turned(-0.3))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), ["livenessFaceNotFound"])

    def test_passes_when_the_face_comes_closer(self):
        frames = [("closer", turned(0.0, interocular=110.0))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), [])

    def test_accepts_a_small_approach_from_a_selfie_already_taken_close(self):
        frames = [("closer", turned(0.0, interocular=89.6))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), [])

    def test_fails_when_the_face_does_not_come_closer(self):
        frames = [("closer", turned(0.0, interocular=84.0))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), ["livenessNotCloser"])

    def test_fails_when_a_frame_looks_like_a_screen_or_print(self):
        frames = [("turnLeft", turned(0.35, real=0.05))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), ["livenessSpoofSuspected"])

    def test_movement_problems_come_before_the_spoof_score(self):
        frames = [("turnLeft", turned(0.0, real=0.05))]

        self.assertEqual(evaluate_liveness(FRONTAL, frames), ["livenessNotTurned"])

    def test_measures_turns_from_the_selfie_pose(self):
        tilted_selfie = PoseReading(faces=1, yaw_offset=0.2, similarity=None, interocular_px=80.0)
        frames = [("turnLeft", turned(0.25)), ("turnRight", turned(-0.2))]

        self.assertEqual(evaluate_liveness(tilted_selfie, frames), ["livenessNotTurned"])


def detected_face(x, y, size, nose_x):
    face = np.zeros(15, dtype=np.float32)
    face[0:4] = (x, y, size, size)
    face[4:6] = (x + size * 0.3, y + size * 0.4)
    face[6:8] = (x + size * 0.7, y + size * 0.4)
    face[8:10] = (nose_x, y + size * 0.6)
    return face


class FakePipeline:
    def __init__(self, faces):
        self._faces = iter(faces)

    def detect(self, image):
        return DetectedFaces(image, 1.0, [next(self._faces)])

    def embed(self, image, face):
        return np.ones(4)

    def similarity(self, first, second):
        return 0.9


class LowScoreAntiSpoof:
    def __init__(self):
        self.calls = 0

    def real_probability(self, image, box):
        self.calls += 1
        return 0.05


class AnalysedAreaTest(unittest.TestCase):
    def test_fits_when_the_face_leaves_room_for_the_context(self):
        self.assertTrue(analysed_area_fits(1280, 720, (600, 300, 150, 150)))

    def test_does_not_fit_when_the_face_fills_the_picture(self):
        self.assertFalse(analysed_area_fits(1280, 720, (400, 100, 400, 400)))


class AntiSpoofOnFramesTest(unittest.TestCase):
    image = np.zeros((720, 1280, 3), dtype=np.uint8)

    def test_does_not_judge_a_close_up_whose_analysed_area_hits_the_border(self):
        anti_spoof = LowScoreAntiSpoof()
        selfie = detected_face(560, 260, 160, 640)
        close_up = detected_face(440, 140, 400, 640)
        verifier = LivenessVerifier(FakePipeline([selfie, close_up]), anti_spoof)

        result = verifier.verify(self.image, [("closer", self.image)])

        self.assertEqual(result["issues"], [])
        self.assertIsNone(result["frames"][0]["realProbability"])

    def test_still_refuses_a_turn_with_a_low_anti_spoof_score(self):
        anti_spoof = LowScoreAntiSpoof()
        selfie = detected_face(560, 260, 160, 640)
        turned_face = detected_face(560, 260, 160, 672)
        verifier = LivenessVerifier(FakePipeline([selfie, turned_face]), anti_spoof)

        result = verifier.verify(self.image, [("turnLeft", self.image)])

        self.assertEqual(result["issues"], ["livenessSpoofSuspected"])
        self.assertEqual(result["frames"][0]["realProbability"], 0.05)


if __name__ == "__main__":
    unittest.main()
