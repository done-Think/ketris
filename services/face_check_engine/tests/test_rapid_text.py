import gc
import unittest
import weakref
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np

from rapid_text import MAX_CACHED_VIEWS, RapidTextOCR
from request_limits import AnalysisLimitExceeded


class RapidTextTest(unittest.TestCase):
    def setUp(self):
        self.calls = 0
        self.box = np.array([[0, 10], [0, 0], [100, 0], [100, 10]], np.float32)

        def engine(image):
            self.calls += 1
            return SimpleNamespace(img=image, boxes=[self.box], txts=['NOME JOÃO DA SILVA'], scores=[0.95])

        self.ocr = RapidTextOCR(engine)

    def test_recognizes_a_view_once_and_normalizes_case_and_accents(self):
        image = np.zeros((30, 120, 3), np.uint8)
        boxes = self.ocr.boxes(image)
        self.assertEqual(self.ocr.read(image, boxes[0]), 'nome joao da silva')
        self.assertEqual(self.ocr.count_regions(image), 1)
        self.assertEqual(self.ocr.reread_narrow(image, boxes[0]), [])
        self.assertEqual(self.calls, 1)

    def test_a_new_capture_is_recognized_even_if_pixels_are_the_same(self):
        image = np.zeros((30, 120, 3), np.uint8)
        self.ocr.boxes(image)
        self.ocr.boxes(image.copy())
        self.assertEqual(self.calls, 2)

    def test_does_not_keep_images_or_extracted_text_after_the_view_expires(self):
        image = np.zeros((30, 120, 3), np.uint8)
        reference = weakref.ref(image)
        self.ocr.boxes(image)
        del image
        gc.collect()
        self.assertIsNone(reference())
        self.assertEqual(self.ocr._cache, {})

    def test_cache_is_bounded_even_when_the_caller_keeps_views(self):
        images = [np.zeros((30, 120, 3), np.uint8) for _ in range(MAX_CACHED_VIEWS + 3)]
        for image in images:
            self.ocr.boxes(image)
        self.assertEqual(len(self.ocr._cache), MAX_CACHED_VIEWS)

    def test_does_not_invent_text_for_unknown_boxes_or_empty_results(self):
        image = np.zeros((30, 120, 3), np.uint8)
        self.assertEqual(self.ocr.read(image, self.box + 1), '')
        empty = RapidTextOCR(lambda image: SimpleNamespace(boxes=None, txts=None, scores=None))
        self.assertEqual(empty.boxes(image), [])

    def test_discards_low_or_invalid_confidence_without_using_expected_identity(self):
        output = SimpleNamespace(
            boxes=[self.box, self.box, self.box],
            txts=['NOME CORRETO', 'NOME INCERTO', 'NOME INVALIDO'],
            scores=[0.9, 0.4, float('nan')],
        )
        ocr = RapidTextOCR(lambda image: output)
        image = np.zeros((30, 120, 3), np.uint8)
        self.assertEqual(len(ocr.boxes(image)), 1)
        self.assertEqual(ocr.read(image, self.box), 'nome correto')

    def test_refuses_modified_models_before_starting_the_engine(self):
        with patch('rapid_text.sha256_of', return_value='invalid'), patch('rapidocr.RapidOCR') as factory:
            with self.assertRaisesRegex(RuntimeError, 'missing or modified'):
                RapidTextOCR()
            factory.assert_not_called()

    def test_view_budget_allows_cached_reads_but_refuses_more_inference(self):
        image = np.zeros((30, 120, 3), np.uint8)
        with self.ocr.request_budget(max_calls=1):
            boxes = self.ocr.boxes(image)
            self.assertEqual(self.ocr.read(image, boxes[0]), 'nome joao da silva')
            with self.assertRaises(AnalysisLimitExceeded):
                self.ocr.boxes(image.copy())
        self.assertEqual(self.calls, 1)
        self.assertEqual(self.ocr._cache, {})

    def test_request_exit_clears_text_even_when_view_remains_alive_or_error_occurs(self):
        image = np.zeros((30, 120, 3), np.uint8)
        with self.assertRaises(RuntimeError), self.ocr.request_budget():
            self.ocr.boxes(image)
            raise RuntimeError('synthetic failure')
        self.assertEqual(self.ocr._cache, {})
        self.ocr.boxes(image)
        self.assertEqual(self.calls, 2)

    def test_time_budget_checks_before_starting_new_native_inference(self):
        image = np.zeros((30, 120, 3), np.uint8)
        with patch('rapid_text.time.monotonic', side_effect=[10.0, 31.0]):
            with self.ocr.request_budget(max_seconds=20):
                with self.assertRaises(AnalysisLimitExceeded):
                    self.ocr.boxes(image)
        self.assertEqual(self.calls, 0)

    def test_time_budget_checks_after_native_inference_before_consuming_output(self):
        image = np.zeros((30, 120, 3), np.uint8)
        with patch('rapid_text.time.monotonic', side_effect=[10.0, 11.0, 31.0]):
            with self.ocr.request_budget(max_seconds=20):
                with self.assertRaises(AnalysisLimitExceeded):
                    self.ocr.boxes(image)
        self.assertEqual(self.calls, 1)
        self.assertEqual(self.ocr._cache, {})

    def test_output_regions_and_text_length_are_bounded(self):
        image = np.zeros((30, 120, 3), np.uint8)
        for output in (
            SimpleNamespace(boxes=[self.box] * 257, txts=['test'] * 257, scores=[0.9] * 257),
            SimpleNamespace(boxes=[self.box], txts=['a' * 513], scores=[0.9]),
        ):
            ocr = RapidTextOCR(lambda image: output)
            with self.assertRaises(AnalysisLimitExceeded):
                ocr.boxes(image)
