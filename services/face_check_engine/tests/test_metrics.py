import unittest

from metrics import (
    equal_error_rate,
    error_rates,
    lowest_threshold_without_false_match,
    percentile,
    smallest_claimable_fmr,
    summarize,
    sweep,
)

GENUINE = [0.62, 0.55, 0.48, 0.30]
IMPOSTOR = [0.05, 0.12, 0.20, 0.41]


class ErrorRatesTest(unittest.TestCase):
    def test_counts_false_matches_and_false_non_matches_at_threshold(self):
        rates = error_rates(GENUINE, IMPOSTOR, 0.4)

        self.assertAlmostEqual(rates.fmr, 0.25)
        self.assertAlmostEqual(rates.fnmr, 0.25)

    def test_score_equal_to_threshold_counts_as_match(self):
        rates = error_rates([0.5], [0.5], 0.5)

        self.assertEqual(rates.fmr, 1.0)
        self.assertEqual(rates.fnmr, 0.0)

    def test_empty_lists_do_not_divide_by_zero(self):
        rates = error_rates([], [], 0.5)

        self.assertEqual((rates.fmr, rates.fnmr), (0.0, 0.0))


class ThresholdSearchTest(unittest.TestCase):
    def test_lowest_threshold_without_false_match_sits_just_above_worst_impostor(self):
        rates = lowest_threshold_without_false_match(GENUINE, IMPOSTOR)

        self.assertGreater(rates.threshold, 0.41)
        self.assertEqual(rates.fmr, 0.0)
        self.assertAlmostEqual(rates.fnmr, 0.25)

    def test_lowest_threshold_needs_impostor_pairs(self):
        self.assertIsNone(lowest_threshold_without_false_match(GENUINE, []))

    def test_equal_error_rate_balances_both_errors(self):
        rates = equal_error_rate(GENUINE, IMPOSTOR)

        self.assertAlmostEqual(rates.fmr, rates.fnmr)

    def test_sweep_covers_zero_to_one(self):
        thresholds = [rates.threshold for rates in sweep(GENUINE, IMPOSTOR)]

        self.assertEqual(thresholds[0], 0.0)
        self.assertEqual(thresholds[-1], 1.0)


class SampleSizeTest(unittest.TestCase):
    def test_rule_of_three_bounds_the_claimable_fmr(self):
        self.assertAlmostEqual(smallest_claimable_fmr(300), 0.01)

    def test_no_claim_without_impostor_pairs(self):
        self.assertIsNone(smallest_claimable_fmr(0))


class SummaryTest(unittest.TestCase):
    def test_summarizes_scores(self):
        summary = summarize(IMPOSTOR)

        self.assertEqual(summary.count, 4)
        self.assertAlmostEqual(summary.minimum, 0.05)
        self.assertAlmostEqual(summary.median, 0.16)
        self.assertAlmostEqual(summary.maximum, 0.41)

    def test_percentile_picks_nearest_rank(self):
        self.assertEqual(percentile([1, 2, 3, 4, 5], 0.5), 3)
        self.assertEqual(percentile([1, 2, 3, 4, 5], 0.95), 5)
        self.assertIsNone(percentile([], 0.5))


if __name__ == "__main__":
    unittest.main()
