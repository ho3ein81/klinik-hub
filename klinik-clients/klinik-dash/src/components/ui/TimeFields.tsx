'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Select } from './Select';

interface TimeFieldsProps {
  /** 0–23 */
  hour24: number;
  /** 0–59 */
  minute: number;
  onChange: (hour24: number, minute: number) => void;
  /** Draws the top border/spacing that separates it from a calendar grid above it. */
  bordered?: boolean;
}

const to24Hour = (hour12: number, ampm: 'AM' | 'PM'): number =>
  ampm === 'PM' ? (hour12 % 12) + 12 : hour12 % 12;

/** Hour / minute / AM-PM selectors — the 12-hour time UI shared by <DatePicker> (showTime) and <TimePicker>. */
export function TimeFields({ hour24, minute, onChange, bordered = true }: TimeFieldsProps) {
  const hour12 = hour24 % 12 || 12;
  const ampm: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';

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

  return (
    <div className={bordered ? 'calendar-time-section' : 'flex items-center gap-2'}>
      <span className="calendar-time-label">
        <Clock className="h-3.5 w-3.5 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <Select
          value={String(hour12)}
          onChange={(v) => onChange(to24Hour(Number(v), ampm), minute)}
          options={hourOptions}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Select value={String(minute)} onChange={(v) => onChange(hour24, Number(v))} options={minuteOptions} />
      </div>
      <div className="min-w-0 flex-1">
        <Select
          value={ampm}
          onChange={(v) => onChange(to24Hour(hour12, v as 'AM' | 'PM'), minute)}
          options={ampmOptions}
        />
      </div>
    </div>
  );
}
