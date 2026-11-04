import unittest

import numpy as np

from text_regions import decode_ctc, fit_chunk, horizontal_text_boxes, split_columns


class LineSegmentationTest(unittest.TestCase):
    def test_only_horizontal_or_slightly_slanted_boxes_are_read_together(self):
        horizontal = np.array([[0, 0], [100, 10], [100, 30], [0, 20]], np.float32)
        vertical = np.array([[0, 0], [20, 0], [20, 100], [0, 100]], np.float32)
        actual = horizontal_text_boxes([horizontal, vertical])
        self.assertEqual(len(actual), 1)
        np.testing.assert_array_equal(actual[0], horizontal)

    def test_finds_dark_text_on_a_dim_background_and_light_text_on_dark(self):
        for background, ink in ((95, 20), (20, 225)):
            with self.subTest(background=background):
                line = np.full((32, 150), background, np.uint8)
                line[8:24, 10:20] = ink
                line[8:24, 60:70] = ink
                chunks = split_columns(line)
                self.assertEqual(len(chunks), 2)
                self.assertEqual(sum(int(np.count_nonzero(chunk == ink)) for chunk in chunks), 320)

    def test_blank_lines_do_not_generate_recognition_chunks(self):
        for background in (0, 95, 255):
            self.assertEqual(split_columns(np.full((32, 200), background, np.uint8)), [])

    def test_short_words_stay_whole_with_margins(self):
        line = np.full((32, 150), 225, np.uint8)
        line[8:24, 10:20] = 20
        line[8:24, 23:33] = 20
        line[8:24, 60:70] = 20
        chunks = split_columns(line)
        self.assertEqual([chunk.shape[1] for chunk in chunks], [29, 16])
        self.assertEqual(sum(int(np.count_nonzero(chunk == 20)) for chunk in chunks), 480)

    def test_long_words_split_between_glyphs_without_losing_ink(self):
        line = np.full((32, 230), 225, np.uint8)
        for left in range(10, 210, 13):
            line[8:24, left : left + 9] = 20
        chunks = split_columns(line)
        self.assertTrue(all(0 < chunk.shape[1] <= 100 for chunk in chunks))
        self.assertEqual(
            sum(int(np.count_nonzero(chunk == 20)) for chunk in chunks),
            int(np.count_nonzero(line == 20)),
        )

    def test_a_connected_line_is_bounded_and_terminates(self):
        line = np.full((32, 300), 225, np.uint8)
        line[8:24, :] = 20
        chunks = split_columns(line)
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(chunk.shape[1] <= 100 for chunk in chunks))

    def test_word_crop_fills_the_model_input_without_a_padded_tail(self):
        line = np.tile(np.arange(40, dtype=np.uint8), (32, 1))
        fitted = fit_chunk(line)
        self.assertEqual(fitted.shape, (32, 100))
        self.assertGreater(np.unique(fitted[:, 70:]).size, 1)


class CtcTest(unittest.TestCase):
    def test_repeated_digits_are_only_merged_when_not_separated_by_blank(self):
        indices = [6, 6, 3, 10, 10, 0, 10, 9, 3]  # 529982
        output = np.zeros((len(indices), 1, 37), np.float32)
        for step, index in enumerate(indices):
            output[step, 0, index] = 1
        self.assertEqual(decode_ctc(output), "529982")
