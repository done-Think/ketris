"""Choose text orientation without consulting the expected person's identity."""
from __future__ import annotations

from typing import Optional

import cv2
import numpy as np

from document_reading import (
    DocumentReading, card_candidates, crop_card, document_type_in,
    has_many_digits, read_document,
)
from text_regions import TextDetector, TextReader, horizontal_text_boxes

FIELD_LABELS = (
    "nome", "cpf", "filiacao", "nascimento", "validade", "assinatura", "local", "observa", "emissor",
    "territorionacional", "registro", "matricula", "naturalidade", "exped",
)


ISSUING_STATES = (
    "acre", "alagoas", "amapa", "amazonas", "bahia", "ceara", "distritofederal", "espiritosanto",
    "goias", "maranhao", "matogrosso", "minasgerais", "para", "paraiba", "parana", "pernambuco",
    "piaui", "riodejaneiro", "riograndedonorte", "riograndedosul", "rondonia", "roraima",
    "santacatarina", "saopaulo", "sergipe", "tocantins",
)
LONG_STATE_NAME = 6
STATE_WEIGHT = 2


def text_orientation_score(lines: list[str]) -> tuple[bool, int]:
    text = "".join(lines).lower()
    labels = sum(label in text for label in FIELD_LABELS)
    states = any(state in text for state in ISSUING_STATES if len(state) >= LONG_STATE_NAME)
    return document_type_in(lines) is not None, labels + (STATE_WEIGHT if states else 0)


def orient_document(
    image: Optional[np.ndarray], detector: Optional[TextDetector], reader: Optional[TextReader]
) -> Optional[np.ndarray]:
    if image is None or detector is None or reader is None:
        return image
    return oriented_text(image, detector, reader)[0]


def oriented_text(
    image: np.ndarray, detector: TextDetector, reader: TextReader,
) -> tuple[np.ndarray, list[np.ndarray], list[str]]:
    best = image
    best_score = (False, 0)
    best_boxes: list[np.ndarray] = []
    best_lines: list[str] = []
    # Rotating all pixels also keeps face detection and OCR in the same coordinates.
    for rotation in (None, cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_180, cv2.ROTATE_90_COUNTERCLOCKWISE):
        candidate = image if rotation is None else cv2.rotate(image, rotation)
        boxes = horizontal_text_boxes(detector.boxes(candidate))
        lines = [reader.read(candidate, box) for box in boxes]
        score = text_orientation_score(lines)
        if rotation is None:
            original_boxes, original_lines = boxes, lines
        if score > best_score:
            best, best_score = candidate, score
            best_boxes, best_lines = boxes, lines
        # An upright document title plus a field label is sufficient evidence.
        if score[0] and score[1] >= 1:
            return candidate, boxes, lines
    # Unknown text is not a reason to rotate a photo or bypass any verification.
    if best_score[0] or best_score[1] >= 2:
        return best, best_boxes, best_lines
    return image, original_boxes, original_lines


def read_document_regions(
    image: np.ndarray,
    detector: Optional[TextDetector],
    reader: TextReader,
    has_card: bool,
    source: np.ndarray,
    boxes: list[np.ndarray],
    source_polygon: Optional[np.ndarray] = None,
) -> DocumentReading:
    """Read independent card panels; a folded document need not share one rotation.

    Select regions and orientation from geometry and printed labels only. Never
    consult the expected name or CPF when deciding what pixels to recognize.
    """
    def read_view(
        view: np.ndarray, regions: list[np.ndarray], lines: Optional[list[str]] = None,
    ) -> DocumentReading:
        if lines is None:
            regions = horizontal_text_boxes(regions)
            lines = [reader.read(view, box) for box in regions]
        reading = read_document(lines, has_card, regions)
        reading.number_rereads = [
            reread
            for line, box in zip(lines, regions)
            if has_many_digits(line)
            for reread in reader.reread_narrow(view, box)
        ]
        return reading

    readings = [read_view(source, boxes)]
    source_readable = readings[0].document_type is not None or text_orientation_score(readings[0].rows)[1] >= 2
    if detector is not None:
        # Perspective correction can blur small screen text. Preserve the full
        # view's reading too, without selecting it by the expected identity.
        if source is not image:
            readings.append(read_view(image, detector.boxes(image)))
        selected: list[np.ndarray] = []
        for polygon in card_candidates(image, min_area_ratio=0.06, max_side=1200):
            area = cv2.contourArea(polygon)
            if any(
                cv2.intersectConvexConvex(polygon, previous)[0]
                / min(area, cv2.contourArea(previous)) > 0.6
                for previous in selected
            ):
                continue
            selected.append(polygon)
            intersection = (
                cv2.intersectConvexConvex(polygon, source_polygon)[0]
                if source_polygon is not None else 0.0
            )
            union = area + (cv2.contourArea(source_polygon) if source_polygon is not None else 0.0) - intersection
            if intersection / max(union, 1.0) < 0.9 or not source_readable:
                view, regions, lines = oriented_text(crop_card(image, polygon), detector, reader)
                readings.append(read_view(view, regions, lines))
            if len(selected) >= 2:
                break
        # Folded documents can have an incomplete outline (glare or a crease).
        # Overlapping tiles along the long axis cover either ordering of panels.
        height, width = image.shape[:2]
        largest_panel_share = max((cv2.contourArea(panel) for panel in selected), default=0) / (height * width)
        if len(selected) < 2 and largest_panel_share < 0.5 and max(height, width) / min(height, width) >= 1.7:
            length = max(height, width)
            extent = int(round(length * 0.6))
            for start in (0, length - extent):
                tile = image[start:start + extent] if height > width else image[:, start:start + extent]
                view, regions, lines = oriented_text(tile, detector, reader)
                readings.append(read_view(view, regions, lines))

    # Keep rows separate across panels; joining them would invent name/number
    # sequences that never appeared together in the document.
    return DocumentReading(
        card_detected=has_card,
        document_type=next((item.document_type for item in readings if item.document_type), None),
        cpfs=list(dict.fromkeys(value for item in readings for value in item.cpfs)),
        rows=list(dict.fromkeys(value for item in readings for value in item.rows)),
        digit_runs=list(dict.fromkeys(value for item in readings for value in item.digit_runs)),
        number_rereads=list(dict.fromkeys(value for item in readings for value in item.number_rereads)),
    )
