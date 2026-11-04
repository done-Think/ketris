from __future__ import annotations

import statistics
from dataclasses import dataclass
from typing import Optional, Sequence

OPENCV_REFERENCE_THRESHOLD = 0.363
SWEEP_STEP = 0.005


@dataclass(frozen=True)
class ErrorRates:
    threshold: float
    fmr: float
    fnmr: float


@dataclass(frozen=True)
class ScoreSummary:
    count: int
    minimum: float
    median: float
    maximum: float


def error_rates(
    genuine: Sequence[float], impostor: Sequence[float], threshold: float
) -> ErrorRates:
    false_matches = sum(1 for score in impostor if score >= threshold)
    false_non_matches = sum(1 for score in genuine if score < threshold)
    return ErrorRates(
        threshold=threshold,
        fmr=false_matches / len(impostor) if impostor else 0.0,
        fnmr=false_non_matches / len(genuine) if genuine else 0.0,
    )


def sweep(
    genuine: Sequence[float], impostor: Sequence[float], step: float = SWEEP_STEP
) -> list[ErrorRates]:
    steps = int(round(1 / step))
    return [error_rates(genuine, impostor, round(index * step, 6)) for index in range(steps + 1)]


def lowest_threshold_without_false_match(
    genuine: Sequence[float], impostor: Sequence[float]
) -> Optional[ErrorRates]:
    if not impostor:
        return None
    threshold = round(max(impostor) + 1e-4, 4)
    return error_rates(genuine, impostor, threshold)


def equal_error_rate(
    genuine: Sequence[float], impostor: Sequence[float]
) -> Optional[ErrorRates]:
    if not genuine or not impostor:
        return None
    return min(sweep(genuine, impostor), key=lambda rates: abs(rates.fmr - rates.fnmr))


def smallest_claimable_fmr(impostor_pairs: int) -> Optional[float]:
    if impostor_pairs <= 0:
        return None
    return 3 / impostor_pairs


def summarize(scores: Sequence[float]) -> Optional[ScoreSummary]:
    if not scores:
        return None
    return ScoreSummary(
        count=len(scores),
        minimum=min(scores),
        median=statistics.median(scores),
        maximum=max(scores),
    )


def percentile(values: Sequence[float], fraction: float) -> Optional[float]:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int(round(fraction * (len(ordered) - 1)))))
    return ordered[index]
