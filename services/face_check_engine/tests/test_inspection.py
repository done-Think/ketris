import unittest
from unittest.mock import Mock, patch

import cv2
import numpy as np

from faces import DetectedFaces
from inspection import (
    RULES, FaceBox, PhotoInspector, PhotoMetrics, dhash, document_brightness,
    document_evidence, evaluate, rule_limits,
)


def metrics(*faces, width=1200, height=900, brightness=120.0, sharpness=150.0, text=0, real=None):
    return PhotoMetrics(
        opened=True,
        width=width,
        height=height,
        brightness=brightness,
        sharpness=sharpness,
        faces=list(faces),
        text_regions=text,
        real_probability=real,
    )


DOCUMENT_PORTRAIT = FaceBox(area_ratio=0.02, interocular_px=55.0)
SELFIE_FACE = FaceBox(area_ratio=0.18, interocular_px=140.0)


class DocumentFrontTest(unittest.TestCase):
    def test_accepts_a_small_portrait_with_printed_data(self):
        self.assertEqual(evaluate("front", metrics(DOCUMENT_PORTRAIT, text=12)), [])

    def test_rejects_a_small_face_without_any_printed_data(self):
        self.assertEqual(evaluate("front", metrics(DOCUMENT_PORTRAIT)), ["documentTextNotFound"])

    def test_rejects_a_selfie_sent_as_document(self):
        self.assertEqual(evaluate("front", metrics(SELFIE_FACE)), ["looksLikeSelfie"])

    def test_rejects_a_selfie_taken_from_farther_away(self):
        distant = FaceBox(area_ratio=0.07, interocular_px=70.0)

        self.assertEqual(evaluate("front", metrics(distant)), ["looksLikeSelfie"])

    def test_rejects_a_photo_without_any_face(self):
        self.assertEqual(evaluate("front", metrics()), ["documentFaceNotFound"])


class DocumentBackTest(unittest.TestCase):
    def test_accepts_a_back_with_printed_data(self):
        self.assertEqual(evaluate("back", metrics(text=9)), [])

    def test_rejects_a_back_without_printed_data(self):
        self.assertEqual(evaluate("back", metrics()), ["documentTextNotFound"])

    def test_rejects_a_selfie_sent_as_back(self):
        self.assertEqual(evaluate("back", metrics(SELFIE_FACE)), ["looksLikeSelfie"])


class SelfieTest(unittest.TestCase):
    def test_accepts_one_large_face(self):
        self.assertEqual(evaluate("selfie", metrics(SELFIE_FACE)), [])

    def test_rejects_a_photo_of_the_document_as_selfie(self):
        self.assertEqual(evaluate("selfie", metrics(DOCUMENT_PORTRAIT)), ["faceTooSmall"])

    def test_rejects_more_than_one_person(self):
        second = FaceBox(area_ratio=0.12, interocular_px=110.0)

        self.assertEqual(evaluate("selfie", metrics(SELFIE_FACE, second)), ["multipleFaces"])

    def test_ignores_tiny_faces_in_the_background(self):
        poster = FaceBox(area_ratio=0.003, interocular_px=12.0)

        self.assertEqual(evaluate("selfie", metrics(SELFIE_FACE, poster)), [])

    def test_rejects_a_photo_without_a_face(self):
        self.assertEqual(evaluate("selfie", metrics()), ["selfieFaceNotFound"])

    def test_rejects_a_close_photo_of_the_document_as_selfie(self):
        self.assertEqual(evaluate("selfie", metrics(SELFIE_FACE, text=14)), ["looksLikeDocument"])

    def test_rejects_a_selfie_that_looks_like_a_screen_or_print(self):
        self.assertEqual(evaluate("selfie", metrics(SELFIE_FACE, real=0.08)), ["spoofSuspected"])

    def test_accepts_a_doubtful_score_and_leaves_it_to_the_reviewer(self):
        self.assertEqual(evaluate("selfie", metrics(SELFIE_FACE, real=0.35)), [])

    def test_tolerates_a_little_text_behind_the_person(self):
        self.assertEqual(evaluate("selfie", metrics(SELFIE_FACE, text=3)), [])

    def test_asks_to_come_closer_when_only_a_tiny_face_shows(self):
        tiny = FaceBox(area_ratio=0.004, interocular_px=20.0)

        self.assertEqual(evaluate("selfie", metrics(tiny)), ["faceTooSmall"])


class QualityTest(unittest.TestCase):
    def test_unreadable_image_stops_everything(self):
        self.assertEqual(evaluate("front", PhotoMetrics(opened=False)), ["unreadable"])

    def test_light_and_focus_come_before_content_problems(self):
        result = evaluate("front", metrics(SELFIE_FACE, brightness=20.0, sharpness=5.0))

        self.assertEqual(result, ["tooDark", "blurry", "looksLikeSelfie"])

    def test_flags_low_resolution(self):
        result = evaluate("selfie", metrics(SELFIE_FACE, width=320, height=240))

        self.assertEqual(result, ["lowResolution"])

    def test_flags_overexposure(self):
        self.assertEqual(evaluate("back", metrics(brightness=240.0, text=9)), ["tooBright"])


class DocumentBrightnessTest(unittest.TestCase):
    def page_with_text(self, ink):
        image = np.full((700, 1000, 3), 255, np.uint8)
        boxes = []
        for y in (100, 250, 400):
            cv2.rectangle(image, (100, y), (300, y + 20), (ink, ink, ink), -1)
            boxes.append(np.array([[90, y - 10], [310, y - 10], [310, y + 30], [90, y + 30]], np.float32))
        return image, boxes

    def test_white_margins_do_not_reject_legible_text_as_overexposure(self):
        image, boxes = self.page_with_text(25)
        self.assertGreater(float(image.mean()), RULES.max_brightness)
        brightness = document_brightness(image, boxes)
        self.assertEqual(evaluate('back', metrics(brightness=brightness, text=3)), [])

    def test_washed_out_text_is_still_rejected(self):
        image, boxes = self.page_with_text(240)
        brightness = document_brightness(image, boxes)
        self.assertIn('tooBright', evaluate('back', metrics(brightness=brightness, text=3)))

    def test_a_blank_page_does_not_get_an_exposure_exemption(self):
        image = np.full((700, 1000, 3), 255, np.uint8)
        self.assertEqual(document_brightness(image, []), 255)
        self.assertIn('tooBright', evaluate('back', metrics(brightness=255, text=0)))


class DocumentSelectionTest(unittest.TestCase):
    def box(self, x, y, width=50, height=15):
        return np.array([[x, y], [x + width, y], [x + width, y + height], [x, y + height]], np.float32)

    def inspector(self, image, boxes, faces):
        pipeline = Mock()
        pipeline.detect.return_value = DetectedFaces(image, 1, faces)
        detector = Mock()
        detector.boxes.return_value = boxes
        return PhotoInspector(pipeline, detector)

    def test_keeps_a_complete_front_instead_of_cropping_only_the_portrait(self):
        image = np.full((500, 700, 3), 230, np.uint8)
        boxes = [self.box(30, 30), self.box(300, 150), self.box(300, 250), self.box(300, 350)]
        portrait = self.box(80, 100, 120, 180)
        inspector = self.inspector(image, boxes, [np.array([100, 130, 60, 90])])
        with patch('inspection.card_candidates', return_value=[portrait]):
            self.assertIs(inspector.document_view(image), image)

    def test_keeps_the_back_instead_of_an_internal_table(self):
        image = np.full((500, 700, 3), 230, np.uint8)
        boxes = [self.box(30, y) for y in (30, 150, 300)] + [self.box(350, 250)]
        inspector = self.inspector(image, boxes, [])
        with patch('inspection.card_candidates', return_value=[self.box(300, 200, 300, 190)]):
            self.assertIs(inspector.document_view(image), image)

    def test_selects_the_front_on_a_sheet_instead_of_a_panel_without_the_visible_face(self):
        image = np.full((1500, 1500, 3), 255, np.uint8)
        front, back = self.box(50, 100, 600, 400), self.box(50, 700, 600, 400)
        boxes = [self.box(350, y) for y in (200, 300, 400, 800, 900, 1000)]
        inspector = self.inspector(image, boxes, [np.array([100, 230, 100, 150])])
        with patch('inspection.card_candidates', return_value=[back, front]):
            np.testing.assert_array_equal(inspector._document_corners(image), front)


class DhashTest(unittest.TestCase):
    def test_same_picture_at_another_size_keeps_the_hash(self):
        gradient = np.tile(np.arange(0, 256, 2, dtype=np.uint8), (96, 1))
        bigger = np.kron(gradient, np.ones((3, 3), dtype=np.uint8))

        self.assertEqual(dhash(gradient), dhash(bigger))
        self.assertEqual(len(dhash(gradient)), 64)


class DocumentEvidenceTest(unittest.TestCase):
    def test_accepts_a_document_whose_type_was_read_without_its_outline(self):
        self.assertTrue(document_evidence("front", metrics(text=2), "CNH"))

    def test_accepts_a_front_full_of_text_with_the_holder_photo(self):
        self.assertTrue(document_evidence("front", metrics(DOCUMENT_PORTRAIT, text=17), None))

    def test_needs_the_holder_photo_on_the_front(self):
        self.assertFalse(document_evidence("front", metrics(text=17), None))

    def test_accepts_a_back_full_of_text(self):
        self.assertTrue(document_evidence("back", metrics(text=9), None))

    def test_accepts_a_back_that_shows_a_field_or_the_issuing_state(self):
        self.assertTrue(document_evidence("back", metrics(text=4), None, labels=1))

    def test_refuses_a_photo_with_little_text_and_no_type(self):
        self.assertFalse(document_evidence("back", metrics(text=4), None))


class RuleLimitsTest(unittest.TestCase):
    def test_reports_the_limits_used_for_each_kind_of_photo(self):
        document = rule_limits("front")
        selfie = rule_limits("selfie")

        self.assertEqual(document["minSharpness"], RULES.min_sharpness)
        self.assertEqual(document["minTextRegions"], RULES.document_min_text_regions)
        self.assertNotIn("minRealProbability", document)
        self.assertEqual(selfie["minRealProbability"], RULES.selfie_min_real_probability)
        self.assertEqual(selfie["minFaceRatio"], RULES.selfie_min_face_ratio)


if __name__ == "__main__":
    unittest.main()
