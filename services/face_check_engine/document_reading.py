from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any, Optional

import cv2
import numpy as np

CARD_SIDE_PX = 800
CARD_MIN_AREA_RATIO = 0.06
CARD_CROP_MIN_SIDE_PX = 1200
CARD_CROP_MAX_SIDE_PX = 1600
CARD_MIN_FILL = 0.8
CARD_ASPECT_RANGE = (1.3, 1.8)
CPF_LENGTH = 11
CPF_LABEL = re.compile(r"cp|pf")

DOCUMENT_KEYWORDS = (
    ("CNH", ("habilit", "dirigir", "driverlicense", "driverlicence", "permisodeconduccion")),
    ("RNE", ("migrat", "estrangeir", "crnm")),
    ("RG", ("identid", "registrogeral")),
)
# Limited OCR confusions in the document title, rather than fuzzy matching any word.
DOCUMENT_TITLE_PATTERNS = {
    "CNH": re.compile(
        r"habi[l1iu]{1,4}t|dr[i1l]ve[a-z]{0,2}[l1i]?[i1l]?cen|perm[i1l]sod[e3]cond|carte[i1l]ranac[i1l]ona"
    ),
    "RG": re.compile(r"ident[i1l]d"),
}
MAX_EXTRA_CPF_CHARACTERS = 2
MAX_CPF_READING_ERRORS = 2
MIN_DIGITS_TO_REREAD = 9
DIGIT_LOOKALIKES = str.maketrans({"o": "0", "q": "0", "d": "0", "i": "1", "l": "1", "z": "2", "s": "5", "b": "8", "g": "9"})


@dataclass
class DocumentReading:
    card_detected: bool = False
    document_type: Optional[str] = None
    cpfs: list[str] = field(default_factory=list)
    rows: list[str] = field(default_factory=list)
    digit_runs: list[str] = field(default_factory=list)
    number_rereads: list[str] = field(default_factory=list)


def cpf_is_valid(digits: str) -> bool:
    if len(digits) != CPF_LENGTH or not digits.isdigit() or len(set(digits)) == 1:
        return False
    for size in (9, 10):
        total = sum(int(digits[i]) * (size + 1 - i) for i in range(size))
        check = (total * 10) % 11 % 10
        if check != int(digits[size]):
            return False
    return True


def cpfs_in(lines: list[str]) -> list[str]:
    found: list[str] = []
    for line in lines:
        digits = re.sub(r"\D", "", line)
        for start in range(0, len(digits) - CPF_LENGTH + 1):
            candidate = digits[start : start + CPF_LENGTH]
            if cpf_is_valid(candidate) and candidate not in found:
                found.append(candidate)
    return found


def document_type_in(lines: list[str]) -> Optional[str]:
    plain = unicodedata.normalize("NFD", "".join(lines).lower())
    joined = re.sub(r"[^a-z0-9]", "", plain)
    for document_type, keywords in DOCUMENT_KEYWORDS:
        pattern = DOCUMENT_TITLE_PATTERNS.get(document_type)
        if any(keyword in joined for keyword in keywords) or (pattern and pattern.search(joined)):
            return document_type
    return None


def text_rows(lines: list[str], boxes: Optional[list[np.ndarray]] = None) -> list[str]:
    if boxes is None or len(boxes) != len(lines):
        return list(lines)
    pieces = sorted(
        (
            (float(box[:, 1].min()), float(box[:, 1].max()), float(box[:, 0].min()), line)
            for line, box in zip(lines, boxes)
        ),
        key=lambda piece: (piece[0] + piece[1]) / 2,
    )
    rows: list[list[Any]] = []
    for top, bottom, left, line in pieces:
        center = (top + bottom) / 2
        height = max(1.0, bottom - top)
        # Overlap alone lets a vertical caption bridge every horizontal field.
        # Compare line centres and heights, without growing the reference band.
        compatible = [
            row for row in rows
            if max(height, row[1]) <= 2 * min(height, row[1])
            and abs(center - row[0]) <= 0.45 * min(height, row[1])
        ]
        if compatible:
            row = min(compatible, key=lambda row: abs(center - row[0]))
            row[2].append((left, line))
        else:
            rows.append([center, height, [(left, line)]])
    return ["".join(line for _, line in sorted(row[2])) for row in rows]


def cpf_rows(rows: list[str]) -> list[str]:
    selected: list[str] = []
    for index, row in enumerate(rows):
        if not CPF_LABEL.search(row):
            continue
        for candidate in rows[index : index + 2]:
            if candidate not in selected:
                selected.append(candidate)
    return selected


def order_corners(points: np.ndarray) -> np.ndarray:
    points = points.reshape(4, 2).astype(np.float32)
    sums, diffs = points.sum(axis=1), np.diff(points, axis=1).ravel()
    return np.array(
        [points[np.argmin(sums)], points[np.argmin(diffs)], points[np.argmax(sums)], points[np.argmax(diffs)]],
        dtype=np.float32,
    )


def card_candidates(
    image: np.ndarray, min_area_ratio: float = CARD_MIN_AREA_RATIO, max_side: int = CARD_SIDE_PX
) -> list[np.ndarray]:
    height, width = image.shape[:2]
    scale = min(1.0, max_side / max(height, width))
    small = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    gray = cv2.GaussianBlur(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY), (5, 5), 0)
    image_area = float(small.shape[0] * small.shape[1])
    masks = []
    border = np.concatenate((gray[0], gray[-1], gray[:, 0], gray[:, -1]))
    if float(np.median(border)) >= 245:
        foreground = cv2.inRange(gray, 0, 245)
        masks.append(cv2.morphologyEx(foreground, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)))
    for low, high in ((40, 120), (10, 30)):
        masks.append(cv2.dilate(cv2.Canny(gray, low, high), np.ones((3, 3), np.uint8)))
    candidates = []
    for mask in masks:
        contours, _ = cv2.findContours(mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:100]:
            area = cv2.contourArea(contour)
            if area / image_area < min_area_ratio:
                break
            if area / image_area > 0.95:
                continue
            polygon = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
            if len(polygon) != 4 or not cv2.isContourConvex(polygon):
                continue
            (_, _), (box_w, box_h), _ = cv2.minAreaRect(contour)
            if min(box_w, box_h) == 0:
                continue
            aspect = max(box_w, box_h) / min(box_w, box_h)
            fill = area / (box_w * box_h)
            if CARD_ASPECT_RANGE[0] <= aspect <= CARD_ASPECT_RANGE[1] and fill >= CARD_MIN_FILL:
                candidates.append(order_corners(polygon) / scale)
    selected = []
    for candidate in sorted(candidates, key=cv2.contourArea, reverse=True):
        area = cv2.contourArea(candidate)
        if any(
            cv2.intersectConvexConvex(candidate, previous)[0]
            / min(area, cv2.contourArea(previous)) > 0.8
            for previous in selected
        ):
            continue
        selected.append(candidate)
    return selected


def card_corners(image: np.ndarray) -> Optional[np.ndarray]:
    candidates = card_candidates(image)
    return candidates[0] if candidates else None


def card_detected(image: np.ndarray) -> bool:
    return card_corners(image) is not None


def crop_card(image: np.ndarray, corners: np.ndarray) -> np.ndarray:
    top_left, top_right, bottom_right, bottom_left = corners
    width = max(np.linalg.norm(top_right - top_left), np.linalg.norm(bottom_right - bottom_left))
    height = max(np.linalg.norm(bottom_left - top_left), np.linalg.norm(bottom_right - top_right))
    zoom = min(CARD_CROP_MAX_SIDE_PX, max(CARD_CROP_MIN_SIDE_PX, max(width, height))) / max(width, height)
    target_width, target_height = int(round(width * zoom)), int(round(height * zoom))
    target = np.array(
        [[0, 0], [target_width - 1, 0], [target_width - 1, target_height - 1], [0, target_height - 1]],
        dtype=np.float32,
    )
    transform = cv2.getPerspectiveTransform(corners.astype(np.float32), target)
    return cv2.warpPerspective(image, transform, (target_width, target_height), flags=cv2.INTER_CUBIC)


def has_many_digits(line: str) -> bool:
    return len(re.sub(r"\D", "", line.translate(DIGIT_LOOKALIKES))) >= MIN_DIGITS_TO_REREAD


def read_document(
    lines: list[str], has_card: bool, boxes: Optional[list[np.ndarray]] = None
) -> DocumentReading:
    rows = text_rows(lines, boxes)
    labelled = cpf_rows(rows)
    return DocumentReading(
        card_detected=has_card,
        document_type=document_type_in(lines),
        cpfs=cpfs_in(labelled),
        rows=rows,
        digit_runs=[run for run in digit_runs(labelled) if len(run) >= CPF_LENGTH],
    )


NAME_CONNECTORS = {"de", "da", "do", "das", "dos", "e"}
MIN_NAME_TOKEN = 3
MIN_FUZZY_TOKEN = 5
NAME_MATCH_SHARE = 0.6


def name_tokens(name: str) -> list[str]:
    plain = unicodedata.normalize("NFD", name.lower())
    plain = "".join(char for char in plain if unicodedata.category(char) != "Mn")
    return [
        token
        for token in re.findall(r"[a-z]+", plain)
        if len(token) >= MIN_NAME_TOKEN and token not in NAME_CONNECTORS
    ]


def contains_with_one_error(token: str, text: str) -> bool:
    if token in text:
        return True
    if len(token) < MIN_FUZZY_TOKEN:
        return False
    size = len(token)
    for start in range(0, len(text) - size + 1):
        window = text[start : start + size]
        if sum(1 for expected, read in zip(token, window) if expected != read) <= 1:
            return True
    return False


def name_found(reading: DocumentReading, expected_name: Optional[str]) -> Optional[bool]:
    tokens = name_tokens(expected_name or "")
    if not tokens:
        return None
    for row in reading.rows:
        letters = "".join(name_tokens(row))
        if not contains_with_one_error(tokens[0], letters):
            continue
        present = sum(1 for token in tokens if contains_with_one_error(token, letters))
        if present / len(tokens) >= NAME_MATCH_SHARE:
            return True
    return False


def digit_runs(lines: list[str]) -> list[str]:
    return [re.sub(r"\D", "", line.translate(DIGIT_LOOKALIKES)) for line in lines]


def contains_in_order(expected: str, read: str) -> bool:
    for start in range(len(read)):
        position = 0
        for index in range(start, min(len(read), start + len(expected) + MAX_EXTRA_CPF_CHARACTERS)):
            if read[index] == expected[position]:
                position += 1
                if position == len(expected):
                    return True
    return False


def closest_substring_distance(expected: str, read: str) -> int:
    previous = [0] * (len(read) + 1)
    for index, expected_digit in enumerate(expected, start=1):
        current = [index] + [0] * len(read)
        for position, read_digit in enumerate(read, start=1):
            current[position] = min(
                previous[position] + 1,
                current[position - 1] + 1,
                previous[position - 1] + (expected_digit != read_digit),
            )
        previous = current
    return min(previous)


def cpf_found_with_reading_errors(reading: DocumentReading, expected: str) -> bool:
    return any(
        closest_substring_distance(expected, run) <= MAX_CPF_READING_ERRORS
        for run in digit_runs(reading.rows + reading.number_rereads)
        if len(run) >= len(expected) - MAX_CPF_READING_ERRORS
    )


def cpf_matches(reading: DocumentReading, expected_cpf: Optional[str]) -> Optional[bool]:
    digits = re.sub(r"\D", "", expected_cpf or "")
    if not digits:
        return None
    if reading.cpfs:
        # A different CPF with valid check digits is a contradiction, not an
        # OCR typo to repair towards the identity supplied by the caller.
        return digits in reading.cpfs
    if digits in reading.cpfs or any(contains_in_order(digits, run) for run in reading.digit_runs):
        return True
    if cpf_found_with_reading_errors(reading, digits):
        return True
    return False if reading.cpfs or reading.digit_runs else None


def summarize_document(
    reading: DocumentReading, expected_name: Optional[str], expected_cpf: Optional[str]
) -> dict[str, Any]:
    comparison = cpf_matches(reading, expected_cpf)
    # Noisy numeric text alone is not evidence that a different CPF was read.
    # Keep the existing match tolerance, but require a valid CPF or a confirmed
    # match before presenting a CPF result to the operator.
    cpf_read = bool(reading.cpfs) or comparison is True
    return {
        "cardDetected": reading.card_detected,
        "documentType": reading.document_type,
        "cpfRead": cpf_read,
        "cpfMatches": comparison if cpf_read else None,
        "nameFound": name_found(reading, expected_name),
    }
