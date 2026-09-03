import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { SanityCheckFinding } from '@/api/outliner';

interface SanityCheckFindingsListProps {
  findings: SanityCheckFinding[];
}

/** Plain-text summary of findings for a native `title` tooltip (no tooltip lib in this codebase). */
export function sanityFindingsTooltip(
  findings: SanityCheckFinding[],
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  return findings
    .map((finding) => {
      const severity = t(`outliner.submitReview.sanityWarning.severity.${finding.severity}`);
      const errorType = t(`outliner.submitReview.sanityWarning.errorType.${finding.error_type}`, {
        defaultValue: finding.error_type,
      });
      return `${severity} · ${errorType}: ${finding.evidence}`;
    })
    .join('\n\n');
}

/**
 * Scrollable list of sanity-check findings (severity, error type, char span, evidence).
 * Embedded directly in the "Submit to Review" dialog so the annotator sees every issue
 * before deciding whether to fix segments or submit anyway.
 */
export function SanityCheckFindingsList({ findings }: SanityCheckFindingsListProps) {
  const { t } = useTranslation();

  return (
    <div className="max-h-64 overflow-y-auto space-y-2 -mx-1 px-1">
      {findings.map((finding, index) => (
        <div
          key={`${finding.segment_id}-${finding.char_span.start}-${index}`}
          className="rounded-md border p-3 text-sm space-y-1"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={finding.severity === 'blocker' ? 'destructive' : 'outline'}>
              {t(`outliner.submitReview.sanityWarning.severity.${finding.severity}`)}
            </Badge>
            <span className="text-muted-foreground">
              {t(`outliner.submitReview.sanityWarning.errorType.${finding.error_type}`, {
                defaultValue: finding.error_type,
              })}
            </span>
            <span className="text-muted-foreground text-xs">
              {t('outliner.submitReview.sanityWarning.charSpan', {
                start: finding.char_span.start,
                end: finding.char_span.end,
              })}
            </span>
          </div>
          {finding.evidence && (
            <p className="text-muted-foreground text-xs wrap-break-word">{finding.evidence}</p>
          )}
        </div>
      ))}
    </div>
  );
}
