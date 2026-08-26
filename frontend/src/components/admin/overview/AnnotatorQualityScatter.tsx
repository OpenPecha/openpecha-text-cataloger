import { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  ScatterController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartOptions, TooltipItem } from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import type { AnnotatorWeeklyBucketBy } from '@/api/outliner'
import { useAnnotatorWeeklyQuality } from '@/hooks'

ChartJS.register(LinearScale, PointElement, ScatterController, Title, Tooltip, Legend)

/** Aligned with tailwind.css Tibetan-inspired admin tokens (burgundy / gold / teal). */
const INK = '#1c1917'
const MUTED = '#57534e'
const GRID = '#e7e5e4'
const PRIMARY = '#af2630'

/**
 * Colour derived from the annotator id, so one dot keeps its colour across weeks and refetches
 * and can be followed through the timeline. Golden-angle hue spacing keeps ids visually apart.
 */
function annotatorColor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const hue = (hash * 137.508) % 360
  const sat = 62 + (hash % 3) * 9
  const light = 38 + (hash % 4) * 6
  return `hsl(${hue.toFixed(1)} ${sat}% ${light}%)`
}

function annotatorScatterOptions(
  avgX: number,
  avgY: number,
  yLabel: string,
  countLabel: string,
  yMax: number,
): ChartOptions<'scatter'> {
  const axisLine = (avg: number) => (ctx: { tick: { value: number } }) =>
    Math.abs(ctx.tick.value - avg) < 1e-9 ? PRIMARY : GRID
  const axisWidth = (avg: number) => (ctx: { tick: { value: number } }) =>
    Math.abs(ctx.tick.value - avg) < 1e-9 ? 2 : 1
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (item: TooltipItem<'scatter'>) => {
            const p = item.raw as {
              name: string
              x: number
              y: number
              count: number
            }
            return [
              p.name,
              `${p.y.toFixed(1)}% ${yLabel}`,
              `${p.count.toLocaleString()} ${countLabel} / ${p.x.toLocaleString()} reviewed`,
            ]
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Reviewed segments with title/author (volume)',
          color: MUTED,
          font: { size: 11 },
        },
        afterBuildTicks: (axis) => {
          if (!axis.ticks.some((t) => Math.abs(t.value - avgX) < 1e-9)) {
            axis.ticks.push({ value: avgX, label: '' })
            axis.ticks.sort((a, b) => a.value - b.value)
          }
        },
        ticks: {
          color: MUTED,
          font: { size: 10 },
          maxRotation: 0,
          // Average tick carries the crosshair only; a label there would collide
          // with the neighbouring round-number tick.
          callback: (value) =>
            Math.abs(Number(value) - avgX) < 1e-9 ? '' : Number(value).toLocaleString(),
        },
        grid: { color: axisLine(avgX), lineWidth: axisWidth(avgX) },
      },
      y: {
        beginAtZero: true,
        // Fixed rather than data-derived: an auto-scaled axis rescales as the slider moves,
        // making a dot look like it rose when only the scale shrank. Each chart picks a
        // ceiling that suits its own range so the dots are not squashed against the floor.
        max: yMax,
        title: {
          display: true,
          text: `${yLabel} (% of reviewed)`,
          color: MUTED,
          font: { size: 11 },
        },
        afterBuildTicks: (axis) => {
          if (!axis.ticks.some((t) => Math.abs(t.value - avgY) < 1e-9)) {
            axis.ticks.push({ value: avgY, label: '' })
            axis.ticks.sort((a, b) => a.value - b.value)
          }
        },
        // Every ceiling is divisible by 5, so five intervals always give whole-number ticks.
        ticks: {
          color: MUTED,
          font: { size: 10 },
          stepSize: yMax / 5,
          autoSkip: false,
          callback: (value) =>
            Math.abs(Number(value) - avgY) < 1e-9 ? '' : `${Number(value).toFixed(0)}%`,
        },
        grid: { color: axisLine(avgY), lineWidth: axisWidth(avgY) },
      },
    },
  }
}

interface AnnotatorQualityScatterProps {
  /** HTML date inputs bounding the query; omit for the endpoint's own default range. */
  readonly dateRange?: { readonly start: string; readonly end: string }
  /** False while the containing tab is closed, so the fetch keeps its lazy cost. */
  readonly enabled?: boolean
  /**
   * Annotator id followed on first render — the viewer's own id on the annotator page, so
   * they find themselves without hunting. They can still click any other dot afterwards.
   */
  readonly initialFocusedAnnotator?: string | null
}

/**
 * Weekly volume-vs-quality scatter for every annotator, with a week slider.
 *
 * Shared by the admin overview and the annotator-facing stats page: both plot the whole team,
 * and differ only in which dot starts focused.
 */
export default function AnnotatorQualityScatter({
  dateRange,
  enabled = true,
  initialFocusedAnnotator = null,
}: AnnotatorQualityScatterProps) {
  const [weeklyBucketBy, setWeeklyBucketBy] = useState<AnnotatorWeeklyBucketBy>('reviewed')
  /** null = "All weeks" (the date-range totals); otherwise an index into `weeklyWeeks`. */
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null)
  /** Annotator followed across weeks; survives slider and bucket changes until cleared. */
  const [focusedAnnotator, setFocusedAnnotator] = useState<string | null>(
    initialFocusedAnnotator,
  )
  const [legendOpen, setLegendOpen] = useState(false)

  /**
   * The viewer's id arrives after the user query resolves, which is usually later than first
   * render — so seed the focus once it appears rather than leaving no dot highlighted.
   */
  useEffect(() => {
    if (initialFocusedAnnotator) setFocusedAnnotator(initialFocusedAnnotator)
  }, [initialFocusedAnnotator])

  const { weekly, isLoading: weeklyLoading } = useAnnotatorWeeklyQuality({
    startDate: dateRange?.start || undefined,
    endDate: dateRange?.end || undefined,
    bucketBy: weeklyBucketBy,
    enabled,
  })

  const weeklyWeeks = useMemo(() => {
    const set = new Set<string>()
    for (const r of weekly?.rows ?? []) if (r.week) set.add(r.week)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [weekly?.rows])

  const activeWeek =
    selectedWeekIdx === null ? null : (weeklyWeeks[selectedWeekIdx] ?? null)

  const weekRangeLabel = useMemo(() => {
    if (!activeWeek) return null
    const start = new Date(`${activeWeek}T00:00:00`)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)}`
  }, [activeWeek])

  /**
   * Under annotation time a recent week is still filling up — work annotated then may not be
   * reviewed yet — so its rates will still move. Flagged so the edge of the trend is not read
   * as a real dip.
   */
  const activeWeekIsPartial = useMemo(() => {
    if (!activeWeek || weeklyBucketBy !== 'annotated') return false
    const weekEnd = new Date(`${activeWeek}T00:00:00`)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return weekEnd >= twoWeeksAgo
  }, [activeWeek, weeklyBucketBy])

  /**
   * Quadrant scatter: one dot per annotator, x = approved segments (volume), y = rate (%).
   * Sourced from the weekly endpoint even for "All weeks", so moving the slider changes the
   * time window and never the metric — the Chart/Table figures count rejection events instead
   * and are not comparable.
   */
  const annotatorScatterData = useMemo(() => {
    const source = weekly?.rows ?? []
    const scoped = activeWeek ? source.filter((r) => r.week === activeWeek) : source
    const totals = new Map<
      string,
      { key: string; name: string; approved: number; edited: number; rejected: number }
    >()
    for (const r of scoped) {
      const key = r.user_id ?? r.name
      const acc =
        totals.get(key) ?? { key, name: r.name, approved: 0, edited: 0, rejected: 0 }
      acc.approved += r.approved
      acc.edited += r.edited
      acc.rejected += r.rejected
      totals.set(key, acc)
    }
    const points = [...totals.values()].map((t) => ({
      key: t.key,
      name: t.name,
      color: annotatorColor(t.key),
      x: t.approved,
      rejection: t.approved ? (t.rejected / t.approved) * 100 : 0,
      edits: t.approved ? (t.edited / t.approved) * 100 : 0,
      rejectionEvents: t.rejected,
      correctionEdits: t.edited,
    }))
    if (!points.length) return null
    const mean = (vals: number[]) =>
      vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    // Axis ceiling per chart: the highest dot rounded up to the next listed step, so a
    // low-rate week fills the height instead of hugging the floor. Fitting the axis exactly
    // to the data instead gives fractional tick labels like 1.2% / 2.4%.
    const ceiling = (vals: number[]) => {
      const top = Math.max(...vals, 0)
      return [10, 20, 30, 40, 50, 60, 80, 100].find((c) => top <= c) ?? 100
    }
    return {
      points,
      avgX: mean(points.map((p) => p.x)),
      avgRejection: mean(points.map((p) => p.rejection)),
      avgEdits: mean(points.map((p) => p.edits)),
      rejectionMax: ceiling(points.map((p) => p.rejection)),
      editsMax: ceiling(points.map((p) => p.edits)),
      maxX: Math.max(...points.map((p) => p.x), 1),
    }
  }, [weekly?.rows, activeWeek])

  /** Every annotator in range, not just the active week, so the legend stays stable. */
  const annotatorRoster = useMemo(() => {
    const seen = new Map<string, { key: string; name: string; color: string }>()
    for (const r of weekly?.rows ?? []) {
      const key = r.user_id ?? r.name
      if (!seen.has(key)) seen.set(key, { key, name: r.name, color: annotatorColor(key) })
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [weekly?.rows])

  /** Selected annotator has no dot in this week; say so rather than let it look lost. */
  const focusedMissingName = useMemo(() => {
    if (!focusedAnnotator) return null
    const inView = annotatorScatterData?.points.some((p) => p.key === focusedAnnotator)
    if (inView) return null
    return annotatorRoster.find((a) => a.key === focusedAnnotator)?.name ?? null
  }, [focusedAnnotator, annotatorScatterData?.points, annotatorRoster])

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-stone-200/80 bg-stone-50/70 px-4 py-3 xl:col-span-2">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-1.5 sm:w-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous week"
              disabled={!weeklyWeeks.length || selectedWeekIdx === null}
              onClick={() =>
                setSelectedWeekIdx((i) => (i === null || i <= 0 ? null : i - 1))
              }
              className="shrink-0 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            <input
              id="annotator-week-slider"
              type="range"
              min={-1}
              max={Math.max(weeklyWeeks.length - 1, -1)}
              step={1}
              value={selectedWeekIdx ?? -1}
              disabled={!weeklyWeeks.length}
              aria-label="Select week"
              aria-valuetext={activeWeek ? `Week of ${activeWeek}` : 'All weeks'}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSelectedWeekIdx(v < 0 ? null : v)
              }}
              className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
            />
            <button
              type="button"
              aria-label="Next week"
              disabled={!weeklyWeeks.length || selectedWeekIdx === weeklyWeeks.length - 1}
              onClick={() =>
                setSelectedWeekIdx((i) =>
                  i === null ? 0 : Math.min(i + 1, weeklyWeeks.length - 1),
                )
              }
              className="shrink-0 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 sm:px-8">
            <span className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
              {(() => {
                if (weeklyLoading) return 'Loading…'
                if (!weeklyWeeks.length) return 'No weekly data'
                if (!activeWeek) return 'All weeks'
                return weekRangeLabel
              })()}
              {activeWeekIsPartial ? (
                <span
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                  title="Some work annotated in this week has not been reviewed yet, so these rates will still change."
                >
                  Partial
                </span>
              ) : null}
            </span>
            {weeklyWeeks.length && activeWeek ? (
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                week {(selectedWeekIdx ?? 0) + 1} of {weeklyWeeks.length}
              </span>
            ) : (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                drag to step week by week
              </span>
            )}
          </div>
        </div>
        <div
          className="flex shrink-0 rounded-lg border border-stone-200/90 bg-white/90 p-0.5"
          role="group"
          aria-label="Bucket weeks by"
        >
          {(
            [
              { key: 'reviewed', label: 'Review time' },
              { key: 'annotated', label: 'Annotation time' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={weeklyBucketBy === opt.key}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                weeklyBucketBy === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-stone-100/90 hover:text-foreground'
              }`}
              onClick={() => {
                setWeeklyBucketBy(opt.key)
                setSelectedWeekIdx(null)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {!annotatorScatterData ? (
        <p className="py-8 text-center text-sm text-muted-foreground xl:col-span-2">
          {weeklyLoading ? 'Loading…' : 'No annotator data for this selection.'}
        </p>
      ) : null}
      {annotatorScatterData
        ? (
            [
              {
                key: 'edits',
                heading: 'Reviewer corrections',
                yLabel: 'Corrections',
                countLabel: 'corrections',
                avgY: annotatorScatterData.avgEdits,
                yMax: annotatorScatterData.editsMax,
                color: INK,
                value: (p: (typeof annotatorScatterData.points)[number]) => p.edits,
                count: (p: (typeof annotatorScatterData.points)[number]) => p.correctionEdits,
              },
              {
                key: 'rejections',
                heading: 'Rejections',
                yLabel: 'Rejections',
                countLabel: 'rejections',
                avgY: annotatorScatterData.avgRejection,
                yMax: annotatorScatterData.rejectionMax,
                color: PRIMARY,
                value: (p: (typeof annotatorScatterData.points)[number]) => p.rejection,
                count: (p: (typeof annotatorScatterData.points)[number]) => p.rejectionEvents,
              },
            ] as const
          ).map((cfg) => (
            <div
              key={cfg.key}
              className="min-w-0 rounded-xl border border-stone-200/80 bg-white/70 p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{cfg.heading}</p>
                <p className="text-[11px] text-muted-foreground">
                  avg {cfg.avgY.toFixed(1)}% · avg volume{' '}
                  {Math.round(annotatorScatterData.avgX).toLocaleString()}
                </p>
              </div>
              <div className="mt-3 h-[20rem] w-full min-w-0 sm:h-[26rem]">
                <Scatter
                  data={{
                    datasets: [
                      {
                        label: cfg.heading,
                        data: annotatorScatterData.points.map((p) => ({
                          x: p.x,
                          y: cfg.value(p),
                          key: p.key,
                          name: p.name,
                          count: cfg.count(p),
                        })),
                        backgroundColor: annotatorScatterData.points.map((p) => p.color),
                        borderColor: annotatorScatterData.points.map((p) =>
                          p.key === focusedAnnotator ? INK : '#ffffff',
                        ),
                        borderWidth: annotatorScatterData.points.map((p) =>
                          p.key === focusedAnnotator ? 2.5 : 1.5,
                        ),
                        pointRadius: annotatorScatterData.points.map((p) =>
                          p.key === focusedAnnotator ? 10 : 5,
                        ),
                        pointHoverRadius: annotatorScatterData.points.map((p) =>
                          p.key === focusedAnnotator ? 12 : 9,
                        ),
                        pointHoverBorderColor: INK,
                        pointHoverBorderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    ...annotatorScatterOptions(
                      annotatorScatterData.avgX,
                      cfg.avgY,
                      cfg.yLabel,
                      cfg.countLabel,
                      cfg.yMax,
                    ),
                    onClick: (_evt, elements) => {
                      const i = elements[0]?.index
                      if (i == null) return
                      const key = annotatorScatterData.points[i]?.key
                      if (key) setFocusedAnnotator((cur) => (cur === key ? null : key))
                    },
                  }}
                />
              </div>
            </div>
          ))
        : null}
      {annotatorRoster.length ? (
        <div className="rounded-xl border border-stone-200/80 bg-white/60 xl:col-span-2">
          <button
            type="button"
            aria-expanded={legendOpen}
            onClick={() => setLegendOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
          >
            <span className="text-xs font-semibold text-foreground">
              {legendOpen ? '▾' : '▸'} Annotators ({annotatorRoster.length})
              {focusedAnnotator ? (
                <span className="ml-2 font-normal text-muted-foreground">
                  following {annotatorRoster.find((a) => a.key === focusedAnnotator)?.name}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {focusedAnnotator
                ? 'click again to stop following'
                : 'click a name or a dot to follow one across weeks'}
            </span>
          </button>
          {legendOpen ? (
            <div className="flex flex-wrap gap-1.5 border-t border-stone-200/80 px-4 py-3">
              {annotatorRoster.map((a) => {
                const on = a.key === focusedAnnotator
                return (
                  <button
                    key={a.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFocusedAnnotator((cur) => (cur === a.key ? null : a.key))}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      on
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-muted-foreground hover:border-stone-300 hover:text-foreground'
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    {a.name}
                  </button>
                )
              })}
            </div>
          ) : null}
          {focusedMissingName ? (
            <p className="border-t border-stone-200/80 px-4 py-2 text-[11px] text-amber-700">
              {focusedMissingName} has no reviewed segments in this week.
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground xl:col-span-2">
        Each dot is one annotator, in their own colour; click a dot to follow that person as you
        step through weeks. Hover for their name and counts. Horizontal axis: segments reviewed
        (volume). Vertical axis: share of those same segments — so both charts use one
        denominator and stay within 100%. The two darker crosshair lines are the averages across
        annotators, so dots far from the crossing point are the outliers.{' '}
        {activeWeek
          ? `Showing the week of ${activeWeek}, bucketed by ${
              weeklyBucketBy === 'reviewed' ? 'review' : 'annotation'
            } time.`
          : 'Showing the whole selected date range; drag the week slider to step through time.'}
      </p>
    </div>
  )
}
