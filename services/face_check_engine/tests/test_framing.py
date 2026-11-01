import unittest
from unittest.mock import Mock

import numpy as np

from faces import DetectedFaces
from framing import face_framing


def face(x, y, width, height):
    result = np.zeros(15, dtype=np.float32)
    result[:4] = (x, y, width, height)
    return result


class FramingTest(unittest.TestCase):
    def setUp(self):
        self.image = np.zeros((720, 1280, 3), dtype=np.uint8)
        self.pipeline = Mock()

    def test_normalizes_detector_coordinates_after_resize_without_recognizing_identity(self):
        self.pipeline.detect.return_value = DetectedFaces(
            np.zeros((360, 640, 3), dtype=np.uint8), 0.5, [face(160, 72, 256, 216)],
        )
        result = face_framing(self.pipeline, self.image)
        self.assertEqual(result, {
            'width': 1280, 'height': 720, 'faceCount': 1,
            'face': {'x': 0.25, 'y': 0.2, 'width': 0.4, 'height': 0.6},
        })
        self.pipeline.detect.assert_called_once_with(self.image)
        self.pipeline.embed.assert_not_called()

    def test_reports_no_face_and_ignores_nonfinite_or_empty_detections(self):
        self.pipeline.detect.return_value = DetectedFaces(self.image, 1, [
            face(float('nan'), 0, 100, 100), face(0, 0, 0, 100),
        ])
        self.assertEqual(face_framing(self.pipeline, self.image), {
            'width': 1280, 'height': 720, 'faceCount': 0, 'face': None,
        })

    def test_counts_even_small_secondary_faces_and_returns_the_largest(self):
        self.pipeline.detect.return_value = DetectedFaces(self.image, 1, [
            face(100, 100, 20, 20), face(320, 144, 512, 432),
        ])
        result = face_framing(self.pipeline, self.image)
        self.assertEqual(result['faceCount'], 2)
        self.assertEqual(result['face']['width'], 0.4)
        self.assertNotIn('passed', result)
        self.assertNotIn('similarity', result)
