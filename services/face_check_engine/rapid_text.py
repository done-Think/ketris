"""Local, batched OCR with hash-checked models bundled in rapidocr 3.10.0."""
from __future__ import annotations

import unicodedata
import weakref
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np

from download_models import sha256_of
from request_limits import AnalysisLimitExceeded

MIN_TEXT_CONFIDENCE = 0.7
MAX_CACHED_VIEWS = 8
# SHA-256 values published in rapidocr 3.10.0's default_models.yaml.
BUNDLED_MODELS = {
    "Det": ("PP-OCRv6_det_small.onnx", "090f04abcd9d9a7498bc4ebf677e4cb9bdce1fe4197ddb7e529f1ef44e1ff94f"),
    "Cls": ("ch_ppocr_mobile_v2.0_cls_mobile.onnx", "e47acedf663230f8863ff1ab0e64dd2d82b838fceb5957146dab185a89d6215c"),
    "Rec": ("PP-OCRv6_rec_small.onnx", "6f327246b50388f3c176ae304bd95767ea6dc0c9ae92153ef8cbe210b3c14884"),
}


class RapidTextOCR:
    """Implement the detector/reader interface without retaining capture images.

    Detection and recognition run together once per view, rather than once per
    text box. Cached coordinates/text expire with the caller's image reference.
    No expected identity is supplied to the OCR engine.
    """

    def __init__(self, engine: Optional[Any] = None, cpu_threads: int = 2) -> None:
        if engine is None:
            import onnxruntime
            import rapidocr
            from rapidocr import RapidOCR

            onnxruntime.disable_telemetry_events()
            root = Path(rapidocr.__file__).resolve().parent / "models"
            params: dict[str, Any] = {
                "Global.log_level": "error",
                "Global.text_score": MIN_TEXT_CONFIDENCE,
                "EngineConfig.onnxruntime.intra_op_num_threads": cpu_threads,
                "EngineConfig.onnxruntime.inter_op_num_threads": 1,
            }
            for stage, (name, checksum) in BUNDLED_MODELS.items():
                model = root / name
                if not model.is_file() or sha256_of(model) != checksum:
                    raise RuntimeError("OCR model missing or modified")
                # Explicit paths prevent model downloads during capture requests.
                params[f"{stage}.model_path"] = str(model)
            engine = RapidOCR(params=params)
            warmup = np.full((96, 480, 3), 255, np.uint8)
            cv2.putText(warmup, "OCR 0123456789", (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
            engine(warmup)
        self._engine = engine
        self._cache: dict[int, tuple[weakref.ReferenceType, list[np.ndarray], list[str]]] = {}
        self._remaining_calls: Optional[int] = None
        self._deadline = 0.0

    @contextmanager
    def request_budget(self, max_calls: int = 24, max_seconds: float = 20.0):
        """Ketris adaptation: bound OCR views/time and discard all derived text."""
        self._cache.clear()
        self._remaining_calls = max_calls
        self._deadline = time.monotonic() + max_seconds
        try:
            yield
        finally:
            self._cache.clear()
            self._remaining_calls = None
            self._deadline = 0.0

    def _check_budget(self) -> None:
        if self._remaining_calls is not None and time.monotonic() >= self._deadline:
            raise AnalysisLimitExceeded

    def _lines(self, image: np.ndarray) -> tuple[list[np.ndarray], list[str]]:
        self._check_budget()
        key = id(image)
        cached = self._cache.get(key)
        if cached is not None and cached[0]() is image:
            return cached[1], cached[2]
        if self._remaining_calls is not None:
            if self._remaining_calls <= 0:
                raise AnalysisLimitExceeded
            self._remaining_calls -= 1
        output = self._engine(image)
        # A native inference cannot be safely interrupted from another thread.
        # Check elapsed time before consuming its output or starting another view.
        if self._remaining_calls is not None and time.monotonic() >= self._deadline:
            raise AnalysisLimitExceeded
        boxes: list[np.ndarray] = []
        texts: list[str] = []
        if output.boxes is not None and output.txts is not None and output.scores is not None:
            if len(output.boxes) > 256 or len(output.txts) > 256:
                raise AnalysisLimitExceeded
            for box, text, score in zip(output.boxes, output.txts, output.scores):
                if not isinstance(text, str) or len(text) > 512:
                    raise AnalysisLimitExceeded
                if not np.isfinite(score) or score < MIN_TEXT_CONFIDENCE:
                    continue
                normalized = unicodedata.normalize("NFD", text.lower())
                texts.append("".join(char for char in normalized if not unicodedata.combining(char)))
                boxes.append(np.asarray(box, dtype=np.float32).copy())

        def release(reference: weakref.ReferenceType) -> None:
            current = self._cache.get(key)
            if current is not None and current[0] is reference:
                self._cache.pop(key, None)

        if len(self._cache) >= MAX_CACHED_VIEWS:
            self._cache.pop(next(iter(self._cache)))
        self._cache[key] = (weakref.ref(image, release), boxes, texts)
        return boxes, texts

    def boxes(self, image: np.ndarray) -> list[np.ndarray]:
        return self._lines(image)[0]

    def count_regions(self, image: np.ndarray) -> int:
        return len(self.boxes(image))

    def read(self, image: np.ndarray, box: np.ndarray) -> str:
        boxes, texts = self._lines(image)
        return next((text for current, text in zip(boxes, texts) if np.array_equal(current, box)), "")

    def reread_narrow(self, image: np.ndarray, box: np.ndarray) -> list[str]:
        # The sequence recognizer reads complete lines, without splitting digits.
        return []
