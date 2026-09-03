import { useState } from 'react';
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SanityCheckFindingsList } from './SanityCheckWarningContent';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  submitDocumentToBdrcInReview,
  checkDocumentSanity,
  type SanityCheckReport,
  type SanityCheckSegmentInput,
} from '@/api/outliner';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { useDocument } from './contexts';

interface SubmitToReviewProps {
  disabled?: boolean;
  disabledReason?: string;
}

function SubmitToReview({ disabled, disabledReason }: SubmitToReviewProps) {
    const { t } = useTranslation();
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const { segments } = useDocument();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isIncomplete, setIsIncomplete] = useState(false);
    // Fallback only: populated if the submit call itself gets held for warnings the
    // up-front check (below) missed, e.g. segments changed after the dialog opened.
    const [submitBlockedReport, setSubmitBlockedReport] = useState<SanityCheckReport | null>(null);

    // Spans/labels as currently shown in the editor, sent to the backend so the check
    // reflects exactly what the annotator sees rather than a fresh DB read.
    const sanityCheckSegments: SanityCheckSegmentInput[] = segments
        .filter((segment) => typeof segment.span_start === 'number' && typeof segment.span_end === 'number')
        .map((segment) => ({
            id: segment.id,
            start: segment.span_start as number,
            end: segment.span_end as number,
            label: segment.label ?? null,
        }));

    const sanityQuery = useQuery({
        queryKey: ['outliner-document-sanity-check', documentId],
        queryFn: ({ signal }) => checkDocumentSanity(documentId!, sanityCheckSegments, signal),
        enabled: false,
        retry: 1,
    });

    const report = submitBlockedReport ?? sanityQuery.data ?? null;
    const hasFindings = (report?.flagged_count ?? 0) > 0;
    const isCheckingSanity = sanityQuery.isFetching;

    const updateStatusMutation = useMutation({
        mutationFn: (ignoreSanityWarnings: boolean) =>
            submitDocumentToBdrcInReview(documentId!, !isIncomplete, ignoreSanityWarnings),
        onSuccess: (result) => {
            if (!result.success && result.sanity_report) {
                setSubmitBlockedReport(result.sanity_report);
                return;
            }
            setConfirmOpen(false);
            setSubmitBlockedReport(null);
            toast.success(t('outliner.submitReview.success'));
            navigate('/outliner')
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    function handleStatusUpdate() {
        if (!documentId) {
            toast.error(t('outliner.submitReview.noDocumentId'));
            return;
        }
        updateStatusMutation.mutate(hasFindings);
    }

    function closeDialog() {
        setConfirmOpen(false);
        setSubmitBlockedReport(null);
    }

    function openConfirm() {
        setIsIncomplete(false);
        setSubmitBlockedReport(null);
        setConfirmOpen(true);
        if (documentId) {
            sanityQuery.refetch();
        }
    }

    const isSubmitting = updateStatusMutation.isPending;
    const isLoading = isSubmitting || isCheckingSanity;

    return (
      <>
        <Button
          type="button"
          disabled={disabled || isSubmitting}
          title={disabled ? disabledReason : t('outliner.submitReview.title')}
          className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={openConfirm}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{t('outliner.submitReview.submit')}</span>
        </Button>

        <Dialog
          open={confirmOpen}
          onOpenChange={(open) => !isSubmitting && !open && closeDialog()}
        >
          <DialogContent showCloseButton={false} className={hasFindings ? 'sm:max-w-xl' : undefined}>
            <DialogHeader>
              <DialogTitle>
                {hasFindings
                  ? t('outliner.submitReview.sanityWarning.title')
                  : t('outliner.submitReview.confirmTitle')}
              </DialogTitle>
              <DialogDescription>
                {hasFindings && report
                  ? t('outliner.submitReview.sanityWarning.description', {
                      blockerCount: report.blocker_count,
                      advisoryCount: report.advisory_count,
                    })
                  : t('outliner.submitReview.confirmDescription')}
              </DialogDescription>
            </DialogHeader>

            {isCheckingSanity && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('outliner.submitReview.sanityWarning.checking')}
              </div>
            )}

            {!isCheckingSanity && sanityQuery.isError && !submitBlockedReport && (
              <p className="text-xs text-muted-foreground">
                {t('outliner.submitReview.sanityWarning.checkFailed')}
              </p>
            )}

            {hasFindings && report && <SanityCheckFindingsList findings={report.findings} />}

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={isIncomplete}
                onCheckedChange={(checked) => setIsIncomplete(checked === true)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium block">
                  {t('outliner.submitReview.incompleteLabel')}
                </span>
                <span className="text-muted-foreground">
                  {t('outliner.submitReview.incompleteHint')}
                </span>
              </span>
            </label>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                {hasFindings ? t('outliner.submitReview.sanityWarning.goBack') : t('common.cancel')}
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={isLoading}
                className={
                  hasFindings
                    ? 'flex items-center gap-2'
                    : 'flex items-center gap-2 bg-green-600 text-white hover:bg-green-700'
                }
                variant={hasFindings ? 'destructive' : 'default'}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {hasFindings
                  ? t('outliner.submitReview.sanityWarning.submitAnyway')
                  : t('outliner.submitReview.submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}

export default SubmitToReview;
