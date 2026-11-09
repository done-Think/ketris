from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

INPUT_SIZE = (736, 736)
BINARY_THRESHOLD = 0.3
POLYGON_THRESHOLD = 0.5
MAX_CANDIDATES = 200
UNCLIP_RATIO = 2.0
IMAGENET_MEAN = (123.675, 116.28, 103.53)
IMAGENET_STD = np.array([0.229, 0.224, 0.225])
RECOGNIZER_SIZE = (100, 32)
NARROW_CHUNK_WIDTHS = (64, 48)
RECOGNIZER_CHARSET = "0123456789abcdefghijklmnopqrstuvwxyz"
RECOGNIZER_TARGET = np.array(
    [[0, RECOGNIZER_SIZE[1] - 1], [0, 0], [RECOGNIZER_SIZE[0] - 1, 0], [RECOGNIZER_SIZE[0] - 1, RECOGNIZER_SIZE[1] - 1]],
    dtype=np.float32,
)


def horizontal_text_boxes(boxes: list[np.ndarray]) -> list[np.ndarray]:
    """Only read horizontal lines in each orientation, including slight skew.

    Vertical captions get their own opportunity when the image/panel rotates;
    stretching them into horizontal words produces noise and wastes inference.
    """
    return [box for box in boxes if np.ptp(box[:, 0]) >= np.ptp(box[:, 1])]


class TextDetector:
    def __init__(self, model_path: Path) -> None:
        net = cv2.dnn.readNetFromONNX(np.frombuffer(model_path.read_bytes(), dtype=np.uint8))
        self._model = cv2.dnn_TextDetectionModel_DB(net)
        self._model.setBinaryThreshold(BINARY_THRESHOLD)
        self._model.setPolygonThreshold(POLYGON_THRESHOLD)
        self._model.setUnclipRatio(UNCLIP_RATIO)
        self._model.setMaxCandidates(MAX_CANDIDATES)
        self._model.setInputSize(INPUT_SIZE)
        self._model.setInputMean(IMAGENET_MEAN)
        self._model.setInputScale(1.0 / 255.0 / IMAGENET_STD)

    def boxes(self, image: np.ndarray) -> list[np.ndarray]:
        height, width = image.shape[:2]
        scale = min(INPUT_SIZE[0] / width, INPUT_SIZE[1] / height)
        resized = cv2.resize(
            image, (max(1, int(width * scale)), max(1, int(height * scale))), interpolation=cv2.INTER_AREA
        )
        canvas = np.zeros((INPUT_SIZE[1], INPUT_SIZE[0], 3), dtype=image.dtype)
        canvas[: resized.shape[0], : resized.shape[1]] = resized
        found, _ = self._model.detect(canvas)
        return [np.asarray(box, dtype=np.float32) / scale for box in found]

    def count_regions(self, image: np.ndarray) -> int:
        return len(self.boxes(image))


def decode_ctc(output: np.ndarray) -> str:
    previous = -1
    characters: list[str] = []
    for step in output:
        index = int(np.argmax(step[0]))
        if index != 0 and index != previous:
            characters.append(RECOGNIZER_CHARSET[index - 1])
        previous = index
    return "".join(characters)


def rectify_line(image: np.ndarray, box: np.ndarray) -> np.ndarray:
    points = box.reshape(4, 2).astype(np.float32)
    bottom_left, top_left, top_right, bottom_right = points
    width = max(np.linalg.norm(top_right - top_left), np.linalg.norm(bottom_right - bottom_left))
    height = max(np.linalg.norm(bottom_left - top_left), np.linalg.norm(bottom_right - top_right), 1.0)
    target_height = RECOGNIZER_SIZE[1]
    target_width = max(target_height, int(round(width * target_height / height)))
    target = np.array(
        [[0, target_height - 1], [0, 0], [target_width - 1, 0], [target_width - 1, target_height - 1]],
        dtype=np.float32,
    )
    warped = cv2.warpPerspective(image, cv2.getPerspectiveTransform(points, target), (target_width, target_height))
    return cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)


def split_columns(gray: np.ndarray, max_width: int = RECOGNIZER_SIZE[0]) -> list[np.ndarray]:
    # Keep words together where possible, then cut long words between characters.
    # A cut at the first minimum used to shave a glyph at the next chunk's edge.
    if gray.min() == gray.max():
        return []
    threshold, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if np.median(gray) > threshold:
        mask = cv2.bitwise_not(mask)
    active = np.flatnonzero(np.any(mask, axis=0))
    if not len(active):
        return []
    margin = 3
    content_width = max_width - 2 * margin
    word_gap = max(3, int(round(gray.shape[0] * 0.15)))
    gaps = np.flatnonzero(np.diff(active) > word_gap)
    chunks: list[np.ndarray] = []
    for first, last in zip(np.r_[0, gaps + 1], np.r_[gaps, len(active) - 1]):
        columns = active[first : last + 1]
        start = 0
        while start < len(columns):
            if columns[-1] - columns[start] < content_width:
                end = len(columns) - 1
            else:
                candidates = np.flatnonzero(
                    (np.diff(columns) > 1)
                    & (columns[1:] - columns[start] < content_width)
                    & (np.arange(len(columns) - 1) >= start)
                )
                end = int(candidates[-1]) if len(candidates) else int(
                    np.searchsorted(columns, columns[start] + content_width) - 1
                )
            left = max(0, int(columns[start]) - margin)
            right = min(gray.shape[1], int(columns[end]) + margin + 1)
            chunks.append(gray[:, left:right])
            start = end + 1
    return chunks


def fit_chunk(chunk: np.ndarray) -> np.ndarray:
    # CRNN expects a word crop fitted to 100 x 32. Large padded tails can be
    # decoded as repeated digits, especially at the end of a CPF.
    return cv2.resize(chunk, RECOGNIZER_SIZE, interpolation=cv2.INTER_CUBIC)


class TextReader:
    def __init__(self, model_path: Path) -> None:
        self._model = cv2.dnn.readNetFromONNX(np.frombuffer(model_path.read_bytes(), dtype=np.uint8))

    def read(self, image: np.ndarray, box: np.ndarray) -> str:
        line = rectify_line(image, box)
        return "".join(self._recognize(fit_chunk(chunk)) for chunk in split_columns(line))

    def reread_narrow(self, image: np.ndarray, box: np.ndarray) -> list[str]:
        line = rectify_line(image, box)
        return [
            "".join(self._recognize(fit_chunk(chunk)) for chunk in split_columns(line, width))
            for width in NARROW_CHUNK_WIDTHS
        ]

    def _recognize(self, chunk: np.ndarray) -> str:
        blob = cv2.dnn.blobFromImage(chunk, size=RECOGNIZER_SIZE, mean=127.5, scalefactor=1 / 127.5)
        self._model.setInput(blob)
        return decode_ctc(self._model.forward())
