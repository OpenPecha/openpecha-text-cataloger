import type { MarkedSpan } from '@/api/outliner';

/**
 * A wrong-text mark while the reject dialog is open. Offsets are *segment-relative*
 * (0 = first character of the body); they become document-absolute on submit.
 */
export interface DraftMark {
  start: number;
  end: number;
  note?: string;
}

/** Merge overlapping/adjacent marks so stored spans never nest or duplicate. */
export function normalizeMarks(marks: DraftMark[]): DraftMark[] {
  if (marks.length <= 1) return [...marks].sort((a, b) => a.start - b.start);
  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const out: DraftMark[] = [];
  for (const mark of sorted) {
    const prev = out.at(-1);
    if (prev && mark.start <= prev.end) {
      prev.end = Math.max(prev.end, mark.end);
      /** Keep whichever note exists; a merged mark should not silently lose one. */
      prev.note = prev.note || mark.note;
    } else {
      out.push({ ...mark });
    }
  }
  return out;
}

/** Convert body-relative draft marks to the document-absolute spans the API stores. */
export function toMarkedSpans(marks: DraftMark[], spanStart: number): MarkedSpan[] {
  return normalizeMarks(marks).map((m) => ({
    start: spanStart + m.start,
    end: spanStart + m.end,
    ...(m.note ? { note: m.note } : {}),
  }));
}
