'use client';

import { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Select } from './Select';
import { formatLocalDate } from '@/lib/utils';
import { useCloseOnOutsideOrEscape, useFloatingPanel } from '@/hooks/useFloatingPanel';

interface DatePickerProps {
  label?: string;
  /** 'YYYY-MM-DD', or 'YYYY-MM-DDTHH:mm' when `showTime` is set. */
  value: string;
  onChange: (value: string) => void;
  /** 'YYYY-MM-DD' — days before this are disabled. */
  minDate?: string;
  /** 'YYYY-MM-DD' — days after this are disabled. */
  maxDate?: string;
  disabled?: boolean;
  errorMessage?: string;
  helperText?: string;
  placeholder?: string;
  /** Adds an hour / minute / AM-PM section below the calendar grid. */
  showTime?: boolean;
}

function parseDateOnly(datePart: string): Date | null {
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const to24Hour = (hour12: number, ampm: 'AM' | 'PM'): number =>
  ampm === 'PM' ? (hour12 % 12) + 12 : hour12 % 12;

export function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  errorMessage,
  helperText,
  placeholder,
  showTime = false,
}: DatePickerProps) {
  const locale = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const { triggerRef, panelRef, position } = useFloatingPanel(open);
  useCloseOnOutsideOrEscape(open, [triggerRef, panelRef], () => setOpen(false));

  const [datePart, timePart] = value ? value.split('T') : ['', ''];
  const selectedDate = useMemo(() => (datePart ? parseDateOnly(datePart) : null), [datePart]);
  const minD = useMemo(() => (minDate ? parseDateOnly(minDate) : null), [minDate]);
  const maxD = useMemo(() => (maxDate ? parseDateOnly(maxDate) : null), [maxDate]);

  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());

  const [hour24, minute] = timePart ? timePart.split(':').map(Number) : [9, 0];
  const hour12 = hour24 % 12 || 12;
  const ampm: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';

  const openPicker = () => {
    if (disabled) return;
    setViewDate(selectedDate ?? new Date());
    setOpen((o) => !o);
  };

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewDate),
    [locale, viewDate],
  );

  const weekdayLabels = useMemo(() => {
    const base = new Date(2023, 0, 1); // a Sunday
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return fmt.format(d);
    });
  }, [locale]);

  const gridDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: Date; outside: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: new Date(year, month, i - startOffset + 1), outside: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), outside: false });
    }
    let next = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ date: new Date(year, month + 1, next), outside: true });
      next += 1;
    }
    return cells;
  }, [viewDate]);

  const isDayDisabled = (d: Date): boolean => {
    if (minD && startOfDay(d) < startOfDay(minD)) return true;
    if (maxD && startOfDay(d) > startOfDay(maxD)) return true;
    return false;
  };

  const commitDate = (d: Date) => {
    if (isDayDisabled(d)) return;
    const next = formatLocalDate(d);
    onChange(showTime ? `${next}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : next);
    if (!showTime) setOpen(false);
  };

  const commitTime = (nextHour24: number, nextMinute: number) => {
    const base = selectedDate ?? viewDate;
    onChange(
      `${formatLocalDate(base)}T${String(nextHour24).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`,
    );
  };

  const displayValue = useMemo(() => {
    if (!selectedDate) return '';
    const datePartLabel = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(selectedDate);
    if (!showTime) return datePartLabel;
    return `${datePartLabel}, ${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
  }, [selectedDate, locale, showTime, hour12, minute, ampm]);

  const hourOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
    [],
  );
  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: String(i).padStart(2, '0') })),
    [],
  );
  const ampmOptions = useMemo(
    () => [
      { value: 'AM', label: 'AM' },
      { value: 'PM', label: 'PM' },
    ],
    [],
  );

  const hasError = Boolean(errorMessage);
  const today = new Date();

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-text-main tracking-tight select-none">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <button
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          type="button"
          id={id}
          disabled={disabled}
          onClick={openPicker}
          className={`
            w-full h-10 px-3.5 pe-9 text-sm text-start rounded-lg bg-surface-card border transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-bg
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${hasError
              ? 'border-status-rejected-fg focus:border-status-rejected-fg focus:ring-status-rejected-bg'
              : 'border-border focus:border-primary focus:ring-primary-tint'
            }
          `}
        >
          <span className={selectedDate ? 'text-text-main' : 'text-text-dimmed'}>
            {selectedDate ? displayValue : (placeholder ?? '')}
          </span>
        </button>
        <span className="pointer-events-none absolute end-3 flex items-center text-text-dimmed">
          {showTime ? <Clock className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
        </span>
      </div>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            className="calendar-panel panel-enter fixed z-110"
            style={{ top: position.top, left: position.left }}
          >
            <div className="calendar-header">
              <button
                type="button"
                className="calendar-nav-btn"
                aria-label="Previous month"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="calendar-title">{monthLabel}</span>
              <button
                type="button"
                className="calendar-nav-btn"
                aria-label="Next month"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="calendar-grid">
              {weekdayLabels.map((wd, i) => (
                <div key={`${wd}-${i}`} className="calendar-weekday">
                  {wd}
                </div>
              ))}
              {gridDays.map(({ date: d, outside }) => {
                const dayDisabled = isDayDisabled(d);
                const selected = selectedDate ? isSameDay(d, selectedDate) : false;
                const isToday = isSameDay(d, today);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={dayDisabled}
                    onClick={() => commitDate(d)}
                    className={[
                      'calendar-day',
                      outside && 'calendar-day--outside',
                      isToday && !selected && 'calendar-day--today',
                      selected && 'calendar-day--selected',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {showTime && (
              <div className="calendar-time-section">
                <span className="calendar-time-label">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <Select
                    value={String(hour12)}
                    onChange={(v) => commitTime(to24Hour(Number(v), ampm), minute)}
                    options={hourOptions}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Select
                    value={String(minute)}
                    onChange={(v) => commitTime(hour24, Number(v))}
                    options={minuteOptions}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Select
                    value={ampm}
                    onChange={(v) => commitTime(to24Hour(hour12, v as 'AM' | 'PM'), minute)}
                    options={ampmOptions}
                  />
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}

      {hasError ? (
        <p className="text-xs text-status-rejected-fg mt-0.5 animate-fadeIn">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
