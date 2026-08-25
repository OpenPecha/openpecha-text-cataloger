import { useMemo } from 'react';
import Highlighter from 'react-highlight-words';
import { normalizeSearchQuery } from '@/features/outliner';

const HIGHLIGHT_CLASS = {
  title: 'segment-highlight-title rounded-sm bg-sky-200/85 box-decoration-clone',
  author: 'segment-highlight-author rounded-sm bg-violet-200/85 box-decoration-clone',
  search: 'highlighter rounded-sm bg-amber-200/90 box-decoration-clone',
  rejection:
    'segment-rejection-mark rounded-sm bg-red-200/90 box-decoration-clone transition-shadow',
  /**
   * Quiet variant: underline instead of a fill. A background would compete with
   * the browser's own selection highlight (same visual channel), which is what
   * made the old red marks unreadable while selecting. An underline leaves the
   * glyphs and their background untouched, so a blue selection paints cleanly
   * over marked text and both stay legible.
   */
  rejectionQuiet:
    'segment-rejection-mark bg-transparent text-inherit underline decoration-wavy decoration-red-500 decoration-1 underline-offset-4 transition-shadow',
} as const;

export interface SegmentHighlightedTextProps {
  text: string;
  /** Title substrings to mark in the body (sky blue). */
  titleWords?: string[];
  /** Author substrings to mark in the body (violet). */
  authorWords?: string[];
  /** In-segment search terms (amber; uses `.highlighter` for match navigation). */
  searchWords?: string[];
  /**
   * Reviewer-marked wrong text (red), by offset rather than by word.
   * Rendered as an outer layer so word highlights still apply inside a mark.
   */
  markedSpans?: { start: number; end: number }[];
  /**
   * Show marked spans as a wavy underline rather than a red fill, and drop the
   * click-to-remove affordance. Keeps marks locatable in the text while leaving
   * the native blue selection readable and the passage copyable; removal moves
   * to the chips below.
   */
  quietMarks?: boolean;
  onMarkClick?: (start: number) => void;
  className?: string;
}

function removeLastTwoTsek(word: string): string {
  const TSEK = '་';
  const parts = word.split(TSEK);
  // Remove any empty strings from accidental trailing tseks
  const nonEmptyParts = parts.filter((part) => part.length > 0);

  // Split the word into characters, leave last 2 characters, merge them
  if (nonEmptyParts.length <= 2) {
    const chars = Array.from(word.trim());
    return chars.slice(0, -2).join('');
  }
  // Join all but the last two
  return nonEmptyParts.slice(0, -1).join(TSEK) + TSEK;
}

/** Title/author words: legacy tsek-trimming highlight behavior (unchanged). */
function metadataWords(words: string[] | undefined): string[] {
  return (words ?? []).map((w) => removeLastTwoTsek(w.trim())).filter(Boolean);
}

/** Search words: shad-aware normalization so the match is exact, not chopped. */
function normalizedSearchWords(words: string[] | undefined): string[] {
  return (words ?? []).map((w) => normalizeSearchQuery(w)).filter(Boolean);
}

/** Split text at mark boundaries so word highlighting can run inside each piece. */
function spanRuns(text: string, spans: { start: number; end: number }[]) {
  const runs: { text: string; start: number; marked: boolean }[] = [];
  let cursor = 0;
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    const start = Math.max(0, Math.min(span.start, text.length));
    const end = Math.max(start, Math.min(span.end, text.length));
    if (end <= cursor) continue;
    if (start > cursor) runs.push({ text: text.slice(cursor, start), start: cursor, marked: false });
    runs.push({ text: text.slice(start, end), start, marked: true });
    cursor = end;
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor), start: cursor, marked: false });
  return runs;
}

export function SegmentHighlightedText({
  text,
  titleWords = [],
  authorWords = [],
  searchWords = [],
  markedSpans,
  quietMarks = false,
  onMarkClick,
  className,
}: SegmentHighlightedTextProps) {
  const wordClass = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of metadataWords(titleWords)) map.set(w, HIGHLIGHT_CLASS.title);
    for (const w of metadataWords(authorWords)) map.set(w, HIGHLIGHT_CLASS.author);
    for (const w of normalizedSearchWords(searchWords)) map.set(w, HIGHLIGHT_CLASS.search);
    return map;
  }, [titleWords, authorWords, searchWords]);

  const allSearchWords = useMemo(
    () => [
      ...metadataWords(titleWords),
      ...metadataWords(authorWords),
      ...normalizedSearchWords(searchWords),
    ],
    [titleWords, authorWords, searchWords]
  );

  if (!text) return null;

  const words = (chunk: string) =>
    allSearchWords.length === 0 ? (
      chunk
    ) : (
      <Highlighter
        searchWords={allSearchWords}
        autoEscape
        textToHighlight={chunk}
        highlightTag={({ children }) => (
          <mark className={wordClass.get(String(children)) ?? HIGHLIGHT_CLASS.search}>
            {children}
          </mark>
        )}
      />
    );

  if (!markedSpans?.length) {
    return allSearchWords.length === 0 ? (
      <span className={className}>{text}</span>
    ) : (
      <span className={className}>{words(text)}</span>
    );
  }

  return (
    <span className={className}>
      {spanRuns(text, markedSpans).map((run) =>
        run.marked ? (
          quietMarks ? (
            /**
             * Underlined, not filled, and deliberately inert: no hover, cursor,
             * or button role, so it reads as an annotation rather than a
             * control. `data-mark-offset` still anchors chip navigation.
             */
            <span
              key={`mk-${run.start}`}
              data-mark-offset={run.start}
              className={HIGHLIGHT_CLASS.rejectionQuiet}
            >
              {words(run.text)}
            </span>
          ) : (
          <mark
            key={`mk-${run.start}`}
            data-mark-offset={run.start}
            className={`${HIGHLIGHT_CLASS.rejection}${
              onMarkClick ? ' cursor-pointer hover:bg-red-300' : ''
            }`}
            onClick={onMarkClick ? () => onMarkClick(run.start) : undefined}
            onKeyDown={
              onMarkClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onMarkClick(run.start);
                    }
                  }
                : undefined
            }
            role={onMarkClick ? 'button' : undefined}
            tabIndex={onMarkClick ? 0 : undefined}
            title={onMarkClick ? 'Click to remove this mark' : undefined}
          >
            {words(run.text)}
          </mark>
          )
        ) : (
          <span key={`tx-${run.start}`}>{words(run.text)}</span>
        )
      )}
    </span>
  );
}
