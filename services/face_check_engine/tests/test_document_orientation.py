import unittest
from unittest.mock import patch

import numpy as np

from document_orientation import orient_document
from faces import DetectedFaces
from inspection import PhotoInspector


class OrientationTest(unittest.TestCase):
    def setUp(self):
        self.upright = np.arange(18, dtype=np.uint8).reshape(2, 3, 3)
        self.lines = 'carteiradeidentidadecpf'
        self.calls = []

        class Detector:
            def boxes(inner, image):
                self.calls.append(image)
                return [np.zeros((4, 2))]

        class Reader:
            def read(inner, image, box):
                return self.lines if np.array_equal(image, self.upright) else 'unrecognized'

        self.detector = Detector()
        self.reader = Reader()

    def test_normalizes_all_four_rotations_without_changing_pixels(self):
        for turns in range(4):
            with self.subTest(turns=turns):
                actual = orient_document(np.rot90(self.upright, turns).copy(), self.detector, self.reader)
                np.testing.assert_array_equal(actual, self.upright)

    def test_keeps_a_recognized_upright_image_without_extra_attempts(self):
        actual = orient_document(self.upright, self.detector, self.reader)
        self.assertIs(actual, self.upright)
        self.assertEqual(len(self.calls), 1)

    def test_uses_multiple_labels_when_the_back_has_no_document_title(self):
        self.lines = 'nomecpfnascimento'
        actual = orient_document(np.rot90(self.upright).copy(), self.detector, self.reader)
        np.testing.assert_array_equal(actual, self.upright)

    def test_uses_registration_labels_when_name_and_cpf_labels_are_unreadable(self):
        self.lines = 'validaemtodoterritorionacionalmatriculanascimento'
        for turns in range(4):
            with self.subTest(turns=turns):
                actual = orient_document(np.rot90(self.upright, turns).copy(), self.detector, self.reader)
                np.testing.assert_array_equal(actual, self.upright)

    def test_uses_the_issuing_state_printed_on_the_back(self):
        self.lines = 'ibelohorzonemaminasgeraissa'
        actual = orient_document(np.rot90(self.upright, 2).copy(), self.detector, self.reader)
        np.testing.assert_array_equal(actual, self.upright)

    def test_does_not_rotate_on_a_single_short_label_or_unrecognized_text(self):
        for lines in ('cpf', 'unrecognized'):
            with self.subTest(lines=lines):
                self.lines = lines
                image = np.rot90(self.upright).copy()
                self.assertIs(orient_document(image, self.detector, self.reader), image)

    def test_keeps_unreadable_input_and_missing_ocr_dependencies(self):
        self.assertIsNone(orient_document(None, self.detector, self.reader))
        self.assertIs(orient_document(self.upright, None, self.reader), self.upright)
        self.assertIs(orient_document(self.upright, self.detector, None), self.upright)

    def test_inspection_normalizes_document_before_measuring_faces(self):
        images = []

        class Pipeline:
            def detect(inner, image):
                images.append(image)
                return DetectedFaces(image, 1, [])

        inspector = PhotoInspector(Pipeline(), self.detector, text_reader=self.reader)
        result = inspector.inspect(np.rot90(self.upright).copy(), 'front')
        np.testing.assert_array_equal(images[-1], self.upright)
        self.assertIn('documentFaceNotFound', result['issues'])

    def test_selfie_keeps_original_orientation(self):
        images = []

        class Pipeline:
            def detect(inner, image):
                images.append(image)
                return DetectedFaces(image, 1, [])

        inspector = PhotoInspector(Pipeline(), self.detector, text_reader=self.reader)
        image = np.rot90(self.upright).copy()
        inspector.inspect(image, 'selfie')
        self.assertIs(images[0], image)

    def test_portrait_and_printed_fields_can_have_different_orientations(self):
        portrait_upright = np.rot90(self.upright).copy()

        class Pipeline:
            def detect(inner, image):
                faces = [np.zeros(15)] if np.array_equal(image, portrait_upright) else []
                return DetectedFaces(image, 1, faces)

        inspector = PhotoInspector(Pipeline(), self.detector, text_reader=self.reader)
        actual = inspector.orient_document(self.upright)
        np.testing.assert_array_equal(actual, portrait_upright)

    def test_uses_the_strongest_portrait_orientation_instead_of_the_first_detection(self):
        class Pipeline:
            def detect(inner, image):
                face = np.zeros(15)
                face[-1] = 0.95 if np.array_equal(image, self.upright) else 0.65
                return DetectedFaces(image, 1, [face])

        inspector = PhotoInspector(Pipeline(), self.detector, text_reader=self.reader)
        for turns in range(4):
            with self.subTest(turns=turns):
                actual = inspector.orient_document(np.rot90(self.upright, turns).copy())
                np.testing.assert_array_equal(actual, self.upright)

    def test_measures_printed_text_upright_without_turning_the_document_portrait_sideways(self):
        text_upright = np.full((700, 1000, 3), 180, np.uint8)
        text_upright[0, 0] = 10
        portrait_upright = np.rot90(text_upright).copy()
        lines = [
            'carteiradeidentidade', 'republicafederativadobrasil',
            'assinaturadotitular', 'minasgerais',
        ]
        boxes = [np.array([[40, y], [600, y], [600, y + 25], [40, y + 25]], np.float32)
                 for y in (100, 200, 300, 400)]
        face = np.array([100, 100, 40, 60, 108, 120, 132, 120, 120, 135, 110, 145, 130, 145, .95])

        class Pipeline:
            def detect(inner, image):
                faces = [face] if np.array_equal(image, portrait_upright) else []
                return DetectedFaces(image, 1, faces)

        class Detector:
            def boxes(inner, image):
                return boxes if np.array_equal(image, text_upright) else []

        class Reader:
            def read(inner, image, box):
                return lines[next(index for index, candidate in enumerate(boxes) if np.array_equal(box, candidate))]

            def reread_narrow(inner, image, box):
                return []

        inspector = PhotoInspector(Pipeline(), Detector(), text_reader=Reader())
        with (
            patch('inspection.card_candidates', return_value=[]),
            patch('document_orientation.card_candidates', return_value=[]),
            patch('inspection.sharpness_of', return_value=100),
        ):
            result = inspector.inspect(portrait_upright, 'front')
        self.assertEqual(result['issues'], [])
        self.assertEqual(result['metrics']['textRegions'], len(lines))
        self.assertEqual(len(result['metrics']['faces']), 1)
        self.assertEqual(result['document']['documentType'], 'RG')
