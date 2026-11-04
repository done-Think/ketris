import unittest
from unittest.mock import Mock

import numpy as np

from faces import DetectedFaces
from liveness import LivenessVerifier


def face(eye_distance):
    result = np.zeros(15, dtype=np.float32)
    result[:4] = (10, 10, 200, 200)
    result[4:8] = (50, 50, 50 + eye_distance, 50)
    return result


class ProximityTest(unittest.TestCase):
    def setUp(self):
        self.image = np.zeros((480, 640, 3), dtype=np.uint8)
        self.pipeline = Mock()
        self.anti_spoof = Mock()
        self.verifier = LivenessVerifier(self.pipeline, self.anti_spoof)

    def readings(self, distance, faces=1, scale=1.0):
        self.pipeline.detect.side_effect = [
            DetectedFaces(self.image, 1.0, [face(100)]),
            DetectedFaces(self.image, scale, [face(distance)] * faces),
        ]

    def test_green_uses_the_same_ten_percent_limit_as_the_final_check(self):
        for distance, ready in [(109, False), (110, True), (120, True)]:
            with self.subTest(distance=distance):
                self.readings(distance)
                result = self.verifier.proximity(self.image, self.image)
                self.assertEqual(result, {"ready": ready, "closerRatio": distance / 100})
        self.pipeline.embed.assert_not_called()
        self.anti_spoof.real_probability.assert_not_called()

    def test_no_green_without_exactly_one_face(self):
        for faces in (0, 2):
            with self.subTest(faces=faces):
                self.readings(120, faces=faces)
                self.assertEqual(
                    self.verifier.proximity(self.image, self.image),
                    {"ready": False, "closerRatio": None},
                )

    def test_compensates_detector_resize_before_comparing(self):
        self.readings(60, scale=0.5)
        self.assertEqual(
            self.verifier.proximity(self.image, self.image),
            {"ready": True, "closerRatio": 1.2},
        )
