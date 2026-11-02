import unittest

import numpy as np

from anti_spoof import expanded_box, softmax


class ExpandedBoxTest(unittest.TestCase):
    def test_grows_the_box_around_its_center(self):
        self.assertEqual(expanded_box(1000, 1000, (400, 400, 100, 100), 2.0), (350, 350, 550, 550))

    def test_shifts_the_box_back_inside_the_image(self):
        left, top, right, bottom = expanded_box(1000, 1000, (10, 10, 100, 100), 4.0)

        self.assertEqual((left, top), (0, 0))
        self.assertEqual((right, bottom), (400, 400))

    def test_never_grows_past_the_image(self):
        left, top, right, bottom = expanded_box(300, 300, (100, 100, 100, 100), 4.0)

        self.assertEqual((left, top, right, bottom), (0, 0, 299, 299))


class SoftmaxTest(unittest.TestCase):
    def test_turns_scores_into_probabilities(self):
        probabilities = softmax(np.array([1.0, 3.0, 0.5]))

        self.assertAlmostEqual(float(probabilities.sum()), 1.0)
        self.assertEqual(int(np.argmax(probabilities)), 1)


if __name__ == "__main__":
    unittest.main()
