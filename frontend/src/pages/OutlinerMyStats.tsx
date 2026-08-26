import { useMemo, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import AnnotatorQualityScatter from '@/components/admin/overview/AnnotatorQualityScatter'
import DateRangeFilter from '@/components/admin/documents/DateRangeFilter'
import { getDefaultDateRange } from '@/components/admin/documents/utils'

/**
 * Annotator-facing view of the weekly quality scatter.
 *
 * Plots the whole team, same as the admin overview — the comparison is the point — and starts
 * focused on the viewer's own dot so they can find themselves without hunting the legend.
 */
export default function OutlinerMyStats() {
  const { user } = useUser()
  const defaultRange = useMemo(() => getDefaultDateRange(), [])
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">My stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your weekly volume and quality, next to every other annotator. Your own dot is
            highlighted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter onUpdateStartDate={setStartDate} onUpdateEndDate={setEndDate} />
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-stone-200/80 bg-white/70 p-4 sm:p-5">
        <AnnotatorQualityScatter
          dateRange={{ start: startDate, end: endDate }}
          initialFocusedAnnotator={user?.id ?? null}
        />
      </div>
    </div>
  )
}
