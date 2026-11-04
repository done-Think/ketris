import base64
import unittest

import cv2
import numpy as np

from document_regions import document_regions
from match_server import Engine, InvalidRequest, regions_payload


class DocumentRegionsTest(unittest.TestCase):
    def test_keeps_the_front_with_a_dark_header_and_discards_inner_frames(self):
        page = np.full((1600, 1524, 3), 255, np.uint8)
        for y in (114, 462, 808):
            cv2.rectangle(page, (56, y), (518, y + 338), (235, 245, 238), -1)
        cv2.rectangle(page, (56, 114), (518, 172), (30, 30, 30), -1)
        cv2.rectangle(page, (138, 235), (256, 400), (150, 150, 150), -1)
        cv2.rectangle(page, (320, 490), (500, 605), (30, 30, 30), 2)
        regions = document_regions(page)
        self.assertEqual(len(regions), 3)
        self.assertAlmostEqual(regions[0]['y'], 114 / 1600, delta=0.01)
        self.assertAlmostEqual(regions[0]['width'], 462 / 1524, delta=0.01)
        self.assertAlmostEqual(regions[0]['height'], 338 / 1600, delta=0.01)

    def test_finds_both_sides_on_one_page_without_duplicate_borders(self):
        page = np.full((1400, 1000, 3), 255, np.uint8)
        cv2.rectangle(page, (170, 150), (830, 570), (80, 80, 80), 4)
        cv2.rectangle(page, (170, 800), (830, 1220), (80, 80, 80), 4)
        regions = document_regions(page)
        self.assertEqual(len(regions), 2)
        self.assertLess(regions[0]['y'], regions[1]['y'])
        for region in regions:
            self.assertAlmostEqual(region['width'], 0.66, delta=0.02)
            self.assertAlmostEqual(region['height'], 0.3, delta=0.02)
            self.assertLessEqual(region['x'] + region['width'], 1)
            self.assertLessEqual(region['y'] + region['height'], 1)

    def test_finds_a_rotated_card(self):
        page = np.full((1200, 1200, 3), 255, np.uint8)
        box = cv2.boxPoints(((600, 600), (700, 440), 25)).astype(np.int32)
        cv2.polylines(page, [box], True, (20, 20, 20), 5)
        self.assertEqual(len(document_regions(page)), 1)

    def test_blank_page_has_no_suggestion_instead_of_an_invented_crop(self):
        self.assertEqual(document_regions(np.full((1200, 800, 3), 255, np.uint8)), [])

    def test_payload_decodes_image_and_returns_regions(self):
        _, encoded = cv2.imencode('.png', np.full((600, 600, 3), 255, np.uint8))
        engine = Engine(pipeline=None, inspector=None, liveness=None, ocr=None)
        result = regions_payload(engine, {'image': base64.b64encode(encoded).decode('ascii')})
        self.assertEqual(result, {'regions': []})

    def test_payload_rejects_non_image(self):
        engine = Engine(pipeline=None, inspector=None, liveness=None, ocr=None)
        with self.assertRaises(InvalidRequest):
            regions_payload(engine, {'image': base64.b64encode(b'not an image').decode('ascii')})
