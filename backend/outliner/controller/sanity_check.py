"""Sanity-check gate for annotator segment submission (text_break_linter)."""
import logging
from typing import Any, Dict, List, Optional

from outliner.models.outliner import OutlinerDocument
from outliner.models.segment_enums import SegmentLabels

logger = logging.getLogger(__name__)


def run_sanity_check(
    text: str, segments: List[Dict[str, Any]], volume_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Run the text-break linter over ``segments`` of ``text``.

    Returns the SanityReport as a dict, or None if the linter package isn't
    installed (submission proceeds without a sanity gate rather than failing).
    """
    try:
        from text_break_linter import check_segmentation
    except ImportError:
        logger.warning("text_break_linter not installed; skipping sanity check")
        return None

    report = check_segmentation(text=text, segments=segments, volume_id=volume_id)
    return report.model_dump()


def segments_for_sanity_check(document: OutlinerDocument) -> List[Dict[str, Any]]:
    """Build the linter's segment dicts from a document's saved DB segments."""
    return [
        {
            "id": segment.id,
            "start": segment.span_start,
            "end": segment.span_end,
            # The linter only checks segments labeled "TEXT"; our label enum stores
            # lowercase "text", so anything else maps to a value it will skip.
            "label": "TEXT" if segment.label == SegmentLabels.TEXT else "OTHER",
        }
        for segment in document.segments
    ]


def normalize_sanity_check_segments(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Normalize caller-supplied segment spans (e.g. from the frontend editor) for the linter.

    Each item is a plain dict with ``id``, ``start``, ``end``, ``label``. Only segments
    explicitly labeled "TEXT" are checked; anything else (or unlabeled) is mapped to a
    value the linter skips, mirroring ``segments_for_sanity_check``.
    """
    return [
        {
            "id": segment["id"],
            "start": segment["start"],
            "end": segment["end"],
            "label": "TEXT" if segment.get("label") == "TEXT" else "OTHER",
        }
        for segment in segments
    ]
