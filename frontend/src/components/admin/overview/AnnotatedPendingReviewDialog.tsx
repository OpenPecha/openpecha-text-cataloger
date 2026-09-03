import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getAnnotatedPendingReviewDocuments } from '@/api/outliner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SimplePagination } from '@/components/ui/simple-pagination';

const PAGE_SIZE = 20;

interface AnnotatedPendingReviewDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Same scope as the dashboard's applied filters, so the list matches the stat that was clicked. */
  readonly userId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AnnotatedPendingReviewDialog({
  open,
  onOpenChange,
  userId,
  startDate,
  endDate,
}: AnnotatedPendingReviewDialogProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open) setPage(1);
  }, [open]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['annotated-pending-review-documents', userId, startDate, endDate, page],
    queryFn: () => getAnnotatedPendingReviewDocuments(page, PAGE_SIZE, userId, startDate, endDate),
    enabled: open,
    staleTime: 30_000,
  });

  const handleOpenDocument = (documentId: string) => {
    onOpenChange(false);
    navigate(`/outliner-admin/documents/${documentId}`);
  };

  const hasPrevPage = page > 1;
  const hasNextPage = data?.has_next ?? false;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,720px)] flex-col gap-0 overflow-hidden sm:max-w-3xl">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle>Annotated, pending review</DialogTitle>
          <DialogDescription>
            Documents with segments the annotator has set title/author on and marked checked,
            awaiting reviewer approval. Skipped documents are excluded.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading…
            </div>
          )}
          {isError && (
            <p className="py-8 text-center text-sm text-destructive">
              Could not load documents.
            </p>
          )}
          {!isLoading && !isError && data?.total === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No documents with segments pending review right now.
            </p>
          )}
          {!isLoading && !isError && data && data.total > 0 && (
            <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/90 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5">Document</th>
                    <th className="px-4 py-2.5">Annotator</th>
                    <th className="px-4 py-2.5 text-right tabular-nums">Segments</th>
                    <th className="px-4 py-2.5 text-right">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr
                      key={row.document_id}
                      className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50/80"
                      onClick={() => handleOpenDocument(row.document_id)}
                    >
                      <td className="max-w-[16rem] px-4 py-2.5 font-medium leading-snug text-primary">
                        <span className="break-words">{row.filename}</span>
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{row.annotator_name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                        {row.segment_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap text-muted-foreground">
                        {formatUpdatedAt(row.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!isLoading && data && data.total > 0 && (
          <div className="shrink-0 space-y-2 border-t pt-3">
            <p className="text-center text-xs text-muted-foreground">
              {data.total} document{data.total === 1 ? '' : 's'} pending review
            </p>
            {(hasPrevPage || hasNextPage) && (
              <SimplePagination
                canGoPrev={hasPrevPage}
                canGoNext={hasNextPage}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
                label={`Page ${page} of ${totalPages}`}
                labelPosition="center"
                isDisabled={isFetching}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AnnotatedPendingReviewDialog;
