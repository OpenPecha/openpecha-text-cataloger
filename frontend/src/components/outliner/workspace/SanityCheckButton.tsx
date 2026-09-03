import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SanityCheckFindingsList } from '../SanityCheckWarningContent';
import { useTranslation } from 'react-i18next';
import { useDocument, useActions } from '../contexts';
import { useOutlinerDocument } from '@/hooks/useOutlinerDocument';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Standalone "preview" sanity check: runs the linter on demand, independent of the
 * "Submit to Review" flow, so the annotator can see what it flags at any point while
 * working — including before every segment is marked checked. Shares its result (via
 * DocumentContext) with the per-segment alert icons in the segment list and workspace,
 * so this button, the sidebar, and the main content never disagree about what's flagged.
 */
function SanityCheckButton() {
  const { t } = useTranslation();
  const { sanityReport, isCheckingSanity, sanityCheckFailed } = useDocument();
  const { onCheckSanity } = useActions();
  const { documentId, isBusy } = useOutlinerDocument();
  const [open, setOpen] = useState(false);

  const hasFindings = (sanityReport?.flagged_count ?? 0) > 0;
  const hasRunCheck = sanityReport !== null;

  function openDialog() {
    setOpen(true);
    onCheckSanity();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={isBusy || !documentId}
        title={t('outliner.workspace.sanityCheck.buttonTitle')}
        className="flex items-center gap-1.5"
        onClick={openDialog}
      >
        {isCheckingSanity ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ShieldCheck className={`w-4 h-4 ${hasFindings ? 'text-red-600' : 'text-green-600'}`} />
        )}
        <span className="hidden sm:inline">{t('outliner.workspace.sanityCheck.button')}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={hasFindings ? 'sm:max-w-xl' : undefined}>
          <DialogHeader>
            <DialogTitle>{t('outliner.workspace.sanityCheck.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {hasFindings && sanityReport
                ? t('outliner.workspace.sanityCheck.resultsDescription', {
                    blockerCount: sanityReport.blocker_count,
                    advisoryCount: sanityReport.advisory_count,
                  })
                : t('outliner.workspace.sanityCheck.noIssuesDescription')}
            </DialogDescription>
          </DialogHeader>

          {isCheckingSanity && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('outliner.submitReview.sanityWarning.checking')}
            </div>
          )}

          {!isCheckingSanity && sanityCheckFailed && (
            <p className="text-xs text-muted-foreground">
              {t('outliner.workspace.sanityCheck.checkFailed')}
            </p>
          )}

          {!isCheckingSanity && hasRunCheck && !sanityCheckFailed && !hasFindings && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              {t('outliner.workspace.sanityCheck.noIssuesTitle')}
            </div>
          )}

          {hasFindings && sanityReport && <SanityCheckFindingsList findings={sanityReport.findings} />}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SanityCheckButton;
