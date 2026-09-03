Text Break Linter
Marker-based linter for Tibetan book/manuscript text/work segmentations. Designed for library and backend use: pass volume text and segment boundaries in memory, get a structured report back.

Error	Meaning
over_segmentation	A chapter/section was segmented as if it were a whole work (should merge)
under_segmentation	Multiple works packed into one segment, or a misplaced interior boundary
Each finding has a severity of blocker (high-precision; treat as must-fix) or advisory (review recommended). Edge location is preserved via rule IDs (OS-, US-) and char_span.

Install
pip install git+https://github.com/OpenPecha/Text_break_linter.git
For local development (editable install plus test extras):

pip install -e ".[dev]"
Runtime depends only on pydantic and typer.

Backend / Python API
Call check_segmentation with the full volume string and segment boundaries. No files required — this is the entry point for a web backend.

from text_break_linter import check_segmentation

report = check_segmentation(
    text=volume_text,
    segments=[
        {"id": "work-001", "start": 0, "end": 4520},
        {"id": "work-002", "start": 4520, "end": 9100},
    ],
    volume_id="my-volume",
)

# JSON for an API response or storage
payload = report.model_dump()
# or: return report.model_dump_json()

if report.blocker_count:
    # reject / require fixes before submission
    ...
Arguments
Argument	Type	Description
text	str	Full volume Unicode text
segments	list of dicts or Segment	Each needs id, start, end (end exclusive). Optional label (default "TEXT"); only TEXT segments are checked
volume_id	str | None	Optional id stored on the report
flag_threshold	float	Keep findings at/above this confidence (default 0.50)
Return value
A Pydantic SanityReport with findings, segment_reports, flagged_count, blocker_count, and advisory_count.

Example finding shape:

{
  "volume_id": "my-volume",
  "flagged_count": 1,
  "blocker_count": 1,
  "advisory_count": 0,
  "findings": [
    {
      "error_type": "under_segmentation",
      "char_span": {"start": 12040, "end": 12110},
      "confidence": 0.91,
      "evidence": "US-1 close→open: …",
      "rule_ids": ["US-1"],
      "severity": "blocker",
      "segment_id": "work-002"
    }
  ],
  "segment_reports": []
}
CLI (optional local tool)
text-break-linter run volume.txt segments.json -o report.json
text-break-linter run volume.txt segments.json -o report.json --gate
text-break-linter version
--flag-threshold (default 0.50) — drop findings below this confidence
--gate — print blockers, summarize advisories, exit 1 if any blocker
--volume-id — optional id stored in the report
Segments JSON:

[
  {"id": "work-001", "start": 0, "end": 4520},
  {"id": "work-002", "start": 4520, "end": 9100}
]
Or {"segments": [ ... ]}.

Evaluate (labeled benchmark)
Score the checker against gold error_type labels on annotated volumes (over_segmentation, under_segmentation; missing/empty → no_issue). Legacy wrong_split gold labels are remapped to under_segmentation.

text-break-linter evaluate --benchmark data/benchmark
text-break-linter evaluate --benchmark data/benchmark --json-out eval.json --no-inference
Python API:

from pathlib import Path
from text_break_linter import run_benchmark, score_report, summarize
from text_break_linter import check_segmentation

# Full directory
summary = run_benchmark(Path("data/benchmark"))
print(summary.overall_micro.f1)

# Or score an existing report against gold segment dicts
report = check_segmentation(text, segments, volume_id="vol")
rows = score_report(report, gold_segments, filename="vol")
summary = summarize("inline", rows)
Detection signals (summary)
Openings: ༄༅, …བཞུགས་སོ, རྒྱ་གར་སྐད་དུ…བོད་སྐད་དུ, homage, terma openers
Closings: རྫོགས་སོ (work-level vs chapter-level), authorship colophons, མངྒ་ལཾ / དགེའོ, terma seals
Chapters: ཡལ་འདབ / སྐབས / ལེའུ + ordinals; …སྟེ་…པའོ།། closers; sibling ordinals in context
Paratext: page numbers, དཀར་ཆག, ISBN / publication matter
Full rule catalog: doc/rules.md (OS-, US-). Implementation: src/text_break_linter/core/markers.py and rules.py.

Tests
pytest