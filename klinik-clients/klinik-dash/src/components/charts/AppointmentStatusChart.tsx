'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface MonthlyStatusDatum {
  /** First day of the month, local time — drives the locale month tick. */
  monthStart: Date;
  booked: number;
  completed: number;
  cancelled: number;
  notShow: number;
  /** All appointments in the month, from the API. Deliberately NOT the sum of
   *  the four charted series: Approved and Rejected are counted here but not
   *  drawn, so this matches the Total stat card above the chart. */
  total: number;
}

export interface AppointmentStatusChartProps {
  /** Oldest month first. */
  data: MonthlyStatusDatum[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}

type SeriesKey = 'booked' | 'completed' | 'cancelled' | 'notShow';

/**
 * Fixed series order and a fixed hue per status — colour follows the entity,
 * never its rank, so a month with no cancellations never repaints the others.
 *
 * These four were validated as a categorical set (lightness band, chroma floor,
 * colour-vision separation, contrast against the white card). Two differ from
 * the status pills elsewhere in the app: the pill palette fails as a set —
 * its cancelled grey has no hue, and Rejected and No Show share one red.
 */
const SERIES: ReadonlyArray<{ key: SeriesKey; status: string; color: string }> = [
  { key: 'booked', status: 'BOOKED', color: '#ea580c' },
  { key: 'completed', status: 'COMPLETED', color: '#059669' },
  { key: 'cancelled', status: 'CANCELLED', color: '#8b5cf6' },
  { key: 'notShow', status: 'NOT_SHOW', color: '#0891b2' },
];

const GAP = 2; // surface gap between adjacent bars in a group
const MAX_BAR = 24;
const MIN_BAR = 3;
const BAR_RADIUS = 4;
const MIN_BAR_HEIGHT = 2; // a non-zero count is never invisible
const PAD_TOP = 30; // reserved strip for the month total
const PAD_RIGHT = 6;
const AXIS_H = 22; // x-axis band, inside the SVG box so the card can't nest-scroll
const TICK_FONT = 10;
const VALUE_FONT = 10;
const TOTAL_FONT = 11;
const MONTH_FONT = 11;
const TOOLTIP_W = 180;
const TOOLTIP_H = 132; // estimate; only decides whether the tooltip flips below
const CHAR_W = 0.62; // approximate advance-width ratio of the UI sans
const TICK_TARGET = 4;

/**
 * Nice-rounded axis maximum on a 1 / 2 / 2.5 / 5 ladder, snapped to whole
 * numbers because appointment counts are integers. Yields 4–5 gridlines
 * (baseline included) across the realistic range.
 */
function buildScale(maxValue: number): { max: number; ticks: number[] } {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return { max: 1, ticks: [0, 1] };
  }

  const rough = maxValue / TICK_TARGET;
  const pow = 10 ** Math.floor(Math.log10(rough));
  // The 2.5 rung only earns its place once it lands on a whole number (25,
  // 250, …). Below that it rounds to 3 and produces ticks like 0/3/6/9/12.
  const ladder = pow >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10];
  let step = pow * 10;
  for (const candidate of ladder) {
    if (candidate * pow >= rough) {
      step = candidate * pow;
      break;
    }
  }
  step = Math.max(1, Math.round(step));

  let max = step * Math.ceil(maxValue / step);
  // When the data lands exactly on the top tick the tallest bar touches the
  // top gridline and its value label gets squeezed against the month total.
  // One extra step buys the label clear air.
  if (max === maxValue) max += step;

  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) ticks.push(value);
  return { max, ticks };
}

/** Rounds the two top corners only; the baseline edge stays square. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.max(0, Math.min(BAR_RADIUS, w / 2, h));
  if (r === 0) return `M${x} ${y}h${w}v${h}h${-w}Z`;
  return (
    `M${x} ${y + r}` +
    `a${r} ${r} 0 0 1 ${r} ${-r}` +
    `h${w - 2 * r}` +
    `a${r} ${r} 0 0 1 ${r} ${r}` +
    `v${h - r}` +
    `h${-w}Z`
  );
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/**
 * Measures an element's width, re-measuring on resize.
 *
 * Uses a callback ref rather than `useRef` + `useEffect([])`: the measured
 * element only mounts once data has loaded (before that the card shows a
 * skeleton), so a mount-time effect would run while the ref was still null,
 * bail out, and never attach the observer — leaving the chart permanently
 * unmeasured and therefore unrendered.
 */
function useContainerWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((element: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!element) return;

    const measure = (next: number) =>
      setWidth((prev) => (Math.abs(prev - next) < 1 ? prev : Math.floor(next)));

    measure(element.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (typeof next === 'number') measure(next);
    });
    observer.observe(element);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, width };
}

interface ActiveBar {
  monthIndex: number;
  /** null when reached by keyboard: the month is active, no single bar. */
  seriesIndex: number | null;
}

export default function AppointmentStatusChart({
  data,
  loading = false,
  error = null,
  className,
}: AppointmentStatusChartProps) {
  const t = useTranslations('dashboard');
  const tStatus = useTranslations('dashboard.status');
  const locale = useLocale();

  const { ref: plotRef, width } = useContainerWidth<HTMLDivElement>();
  const [active, setActive] = useState<ActiveBar | null>(null);
  const [focusedMonth, setFocusedMonth] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const hitRefs = useRef<Array<SVGRectElement | null>>([]);
  const tableId = useId();

  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  // Add the year to the tick only when the window straddles one.
  const spansYears = useMemo(
    () => new Set(data.map((d) => d.monthStart.getFullYear())).size > 1,
    [data],
  );
  const monthTickFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(
        locale,
        spansYears ? { month: 'short', year: '2-digit' } : { month: 'short' },
      ),
    [locale, spansYears],
  );
  const monthLongFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );

  const maxValue = useMemo(
    () => data.reduce((max, d) => Math.max(max, ...SERIES.map((s) => d[s.key])), 0),
    [data],
  );
  const scale = useMemo(() => buildScale(maxValue), [maxValue]);
  const tickLabels = useMemo(
    () => scale.ticks.map((value) => numberFormat.format(value)),
    [scale.ticks, numberFormat],
  );
  const widestValue = useMemo(
    () => numberFormat.format(maxValue).length,
    [maxValue, numberFormat],
  );

  const isEmpty = data.length > 0 && maxValue === 0;

  const layout = useMemo(() => {
    if (width <= 0 || data.length === 0) return null;

    const plotHeight = width < 420 ? 160 : width < 768 ? 200 : 240;
    const widestTick = Math.max(...tickLabels.map((label) => label.length));
    const padLeft = Math.ceil(widestTick * TICK_FONT * CHAR_W) + 8;
    const plotWidth = Math.max(40, width - padLeft - PAD_RIGHT);
    const band = plotWidth / data.length;
    const inset = Math.min(10, band * 0.12);
    const rawBar = (band - inset * 2 - GAP * (SERIES.length - 1)) / SERIES.length;
    const barW = Math.max(MIN_BAR, Math.min(MAX_BAR, Math.round(rawBar)));
    const groupWidth = barW * SERIES.length + GAP * (SERIES.length - 1);
    const baselineY = PAD_TOP + plotHeight;

    return {
      height: PAD_TOP + plotHeight + AXIS_H,
      padLeft,
      band,
      barW,
      groupWidth,
      baselineY,
      // Only draw a value label when it fits its bar's slot with air to spare;
      // below that the tooltip and the data table carry the numbers.
      showValueLabels: barW + GAP >= Math.ceil(widestValue * VALUE_FONT * CHAR_W) + 2,
      yOf: (value: number) =>
        baselineY - (Math.min(value, scale.max) / scale.max) * plotHeight,
      groupLeft: (index: number) =>
        Math.round(padLeft + index * band + (band - groupWidth) / 2),
      bandLeft: (index: number) => padLeft + index * band,
    };
  }, [width, data.length, tickLabels, widestValue, scale.max]);

  const handlePointer = (
    event: React.PointerEvent<SVGRectElement>,
    monthIndex: number,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = ((event.clientX - rect.left) / rect.width) * SERIES.length;
    const seriesIndex = Math.min(SERIES.length - 1, Math.max(0, Math.floor(ratio)));
    setActive({ monthIndex, seriesIndex });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<SVGRectElement>,
    monthIndex: number,
  ) => {
    let next: number;
    if (event.key === 'ArrowRight') next = Math.min(data.length - 1, monthIndex + 1);
    else if (event.key === 'ArrowLeft') next = Math.max(0, monthIndex - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = data.length - 1;
    else if (event.key === 'Escape') {
      setActive(null);
      event.currentTarget.blur();
      return;
    } else return;
    event.preventDefault();
    hitRefs.current[next]?.focus();
  };

  const tooltip = (() => {
    if (!layout || !active || isEmpty) return null;
    const datum = data[active.monthIndex];
    if (!datum) return null;

    const { seriesIndex } = active;
    const anchorX =
      seriesIndex === null
        ? layout.groupLeft(active.monthIndex) + layout.groupWidth / 2
        : layout.groupLeft(active.monthIndex) +
          seriesIndex * (layout.barW + GAP) +
          layout.barW / 2;
    const markTop =
      seriesIndex === null
        ? Math.min(...SERIES.map((s) => layout.yOf(datum[s.key])))
        : layout.yOf(datum[SERIES[seriesIndex].key]);
    const above = markTop > TOOLTIP_H + 8;
    const half = TOOLTIP_W / 2 + 2;

    return {
      datum,
      seriesIndex,
      above,
      left: Math.min(Math.max(anchorX, half), Math.max(half, width - half)),
      top: above ? markTop - 8 : markTop + 8,
    };
  })();

  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-surface-card p-4 shadow-subtle sm:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-text-main">{t('chart.title')}</h2>
          <p className="mt-0.5 text-xs text-text-muted">{t('chart.subtitle')}</p>
        </div>
        {data.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={tableOpen}
            aria-controls={tableId}
            onClick={() => setTableOpen((open) => !open)}
          >
            {tableOpen ? t('chart.hideTable') : t('chart.showTable')}
          </Button>
        )}
      </div>

      {/* Always present at 2+ series, so identity is never colour alone. */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-xs font-medium text-text-muted">
              {tStatus(series.status)}
            </span>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-status-rejected-fg">
          {error}
        </p>
      ) : loading && data.length === 0 ? (
        <div className="mt-4 h-[212px] animate-pulse rounded-xl bg-surface-bg" />
      ) : (
        <div
          ref={plotRef}
          className="relative mt-2 w-full"
          style={{ minHeight: PAD_TOP + 160 + AXIS_H }}
        >
          {layout && (
            <svg
              width={width}
              height={layout.height}
              viewBox={`0 0 ${width} ${layout.height}`}
              role="group"
              aria-label={t('chart.ariaLabel')}
              className="block"
            >
              {/* Painted layers are hidden from the a11y tree; the focusable
                  hit rects below carry the per-month reading. */}
              <g aria-hidden="true">
                {scale.ticks.map((tick, index) => {
                  const y = Math.round(layout.yOf(tick)) + 0.5;
                  return (
                    <g key={tick}>
                      <line
                        x1={layout.padLeft}
                        x2={width - PAD_RIGHT}
                        y1={y}
                        y2={y}
                        stroke="var(--color-border)"
                        strokeWidth={1}
                        shapeRendering="crispEdges"
                      />
                      <text
                        x={layout.padLeft - 6}
                        y={y + 3}
                        textAnchor="end"
                        fontSize={TICK_FONT}
                        fill="var(--color-text-dimmed)"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {tickLabels[index]}
                      </text>
                    </g>
                  );
                })}

                {data.map((datum, monthIndex) => {
                  const groupLeft = layout.groupLeft(monthIndex);
                  const bandCenter = layout.bandLeft(monthIndex) + layout.band / 2;
                  const dimGroup = active !== null && active.monthIndex !== monthIndex;

                  return (
                    <g key={monthKey(datum.monthStart)}>
                      <text
                        x={bandCenter}
                        y={TOTAL_FONT}
                        textAnchor="middle"
                        fontSize={TOTAL_FONT}
                        fontWeight={600}
                        fill="var(--color-text-muted)"
                        style={{
                          fontVariantNumeric: 'tabular-nums',
                          opacity: dimGroup ? 0.4 : 1,
                          transition: 'opacity 150ms ease',
                        }}
                      >
                        {/* Labelled where there is room, because this figure
                            counts every appointment in the month — including
                            Approved and Rejected, which are not drawn — so the
                            four bars deliberately do not sum to it. */}
                        {layout.showValueLabels
                          ? `${numberFormat.format(datum.total)} ${t('chart.total')}`
                          : numberFormat.format(datum.total)}
                      </text>

                      {SERIES.map((series, seriesIndex) => {
                        const value = datum[series.key];
                        const x = groupLeft + seriesIndex * (layout.barW + GAP);
                        const top = layout.yOf(value);
                        const height =
                          value > 0
                            ? Math.max(MIN_BAR_HEIGHT, layout.baselineY - top)
                            : 0;
                        const opacity = dimGroup
                          ? 0.3
                          : active === null ||
                              active.seriesIndex === null ||
                              active.seriesIndex === seriesIndex
                            ? 1
                            : 0.7;

                        return (
                          <g key={series.key}>
                            {/* Zero draws no bar — a stub would read as a real
                                small count. The label, tooltip and table say 0. */}
                            {height > 0 && (
                              <path
                                d={barPath(x, layout.baselineY - height, layout.barW, height)}
                                fill={series.color}
                                style={{
                                  fillOpacity: opacity,
                                  transition: 'fill-opacity 150ms ease',
                                }}
                              />
                            )}
                            {layout.showValueLabels && (
                              <text
                                x={x + layout.barW / 2}
                                y={(height > 0 ? layout.baselineY - height : layout.baselineY) - 4}
                                textAnchor="middle"
                                fontSize={VALUE_FONT}
                                fill={
                                  value > 0
                                    ? 'var(--color-text-main)'
                                    : 'var(--color-text-dimmed)'
                                }
                                style={{
                                  fontVariantNumeric: 'tabular-nums',
                                  opacity: dimGroup ? 0.4 : 1,
                                  transition: 'opacity 150ms ease',
                                }}
                              >
                                {numberFormat.format(value)}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      <text
                        x={bandCenter}
                        y={layout.baselineY + 15}
                        textAnchor="middle"
                        fontSize={MONTH_FONT}
                        fill="var(--color-text-muted)"
                      >
                        {monthTickFormat.format(datum.monthStart)}
                      </text>
                    </g>
                  );
                })}

                {focusedMonth !== null && (
                  <rect
                    x={layout.bandLeft(focusedMonth) + 1}
                    y={1}
                    width={layout.band - 2}
                    height={layout.height - 2}
                    rx={8}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                  />
                )}
              </g>

              {/* One full-height hit target per month, far wider than any bar.
                  Which series is hovered comes from the pointer's position
                  inside the band, so no mark needs a pinpoint target. */}
              {!isEmpty &&
                data.map((datum, monthIndex) => (
                  <rect
                    key={monthKey(datum.monthStart)}
                    ref={(node) => {
                      hitRefs.current[monthIndex] = node;
                    }}
                    x={layout.bandLeft(monthIndex)}
                    y={0}
                    width={layout.band}
                    height={layout.height}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${monthLongFormat.format(datum.monthStart)}: ${SERIES.map(
                      (series) =>
                        `${tStatus(series.status)} ${numberFormat.format(datum[series.key])}`,
                    ).join(', ')}. ${t('chart.total')} ${numberFormat.format(datum.total)}`}
                    style={{ outline: 'none' }}
                    onPointerMove={(event) => handlePointer(event, monthIndex)}
                    onPointerDown={(event) => handlePointer(event, monthIndex)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => {
                      setFocusedMonth(monthIndex);
                      setActive({ monthIndex, seriesIndex: null });
                    }}
                    onBlur={() => {
                      setFocusedMonth(null);
                      setActive(null);
                    }}
                    onKeyDown={(event) => handleKeyDown(event, monthIndex)}
                  />
                ))}
            </svg>
          )}

          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="max-w-[240px] text-center text-sm text-text-muted">
                {t('chart.empty')}
              </p>
            </div>
          )}

          {tooltip && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute z-10 rounded-lg border border-border bg-surface-card p-2.5 shadow-dropdown"
              style={{
                left: tooltip.left,
                top: tooltip.top,
                width: TOOLTIP_W,
                transform: tooltip.above
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
              }}
            >
              <p className="mb-1.5 text-xs font-semibold text-text-main">
                {monthLongFormat.format(tooltip.datum.monthStart)}
              </p>
              <ul className="space-y-1">
                {SERIES.map((series, seriesIndex) => (
                  <li
                    key={series.key}
                    className="flex items-center justify-between gap-2 whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="h-0.5 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      <span
                        className={cn(
                          'text-xs',
                          tooltip.seriesIndex === seriesIndex
                            ? 'text-text-main'
                            : 'text-text-muted',
                        )}
                      >
                        {tStatus(series.status)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'text-xs tabular-nums text-text-main',
                        tooltip.seriesIndex === seriesIndex ? 'font-bold' : 'font-semibold',
                      )}
                    >
                      {numberFormat.format(tooltip.datum[series.key])}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border pt-1.5">
                <span className="text-xs text-text-muted">{t('chart.total')}</span>
                <span className="text-xs font-bold tabular-nums text-text-main">
                  {numberFormat.format(tooltip.datum.total)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* The table twin is always in the accessibility tree; the button only
          decides whether it is also visible. */}
      {data.length > 0 && (
        <div id={tableId} className={tableOpen ? 'mt-4 overflow-x-auto' : 'sr-only'}>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t('chart.tableCaption')}</caption>
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-text-dimmed">
                <th scope="col" className="pb-3">
                  {t('chart.columns.month')}
                </th>
                {SERIES.map((series) => (
                  <th key={series.key} scope="col" className="pb-3 text-right">
                    {tStatus(series.status)}
                  </th>
                ))}
                <th scope="col" className="pb-3 text-right">
                  {t('chart.total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((datum) => (
                <tr key={monthKey(datum.monthStart)}>
                  <th scope="row" className="py-2.5 font-medium text-text-muted">
                    {monthLongFormat.format(datum.monthStart)}
                  </th>
                  {SERIES.map((series) => (
                    <td
                      key={series.key}
                      className="py-2.5 text-right tabular-nums text-text-main"
                    >
                      {numberFormat.format(datum[series.key])}
                    </td>
                  ))}
                  <td className="py-2.5 text-right font-semibold tabular-nums text-text-main">
                    {numberFormat.format(datum.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
