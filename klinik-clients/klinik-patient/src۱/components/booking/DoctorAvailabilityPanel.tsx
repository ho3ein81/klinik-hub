'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { getDoctorWeeklyAvailability } from '@/services/availability.service';
import type { DayOfWeek, DoctorAvailability } from '@/types/domain';

const DAY_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

interface DoctorAvailabilityPanelProps {
  doctorId: string;
}

export function DoctorAvailabilityPanel({ doctorId }: DoctorAvailabilityPanelProps) {
  const t = useTranslations('home');
  const tDay = useTranslations('daysOfWeek');

  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDoctorWeeklyAvailability(doctorId)
      .then((res) => {
        if (!cancelled) setAvailabilities(res);
      })
      .catch(() => {
        if (!cancelled) setAvailabilities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const sorted = [...availabilities].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return <p className="py-2 text-xs text-text-dimmed">{t('noAvailability')}</p>;
  }

  return (
    // No border-t here: the caller already draws the separator above the
    // heading, and this one would only appear on the success branch — so the
    // divider vanished in the loading and "no availability" states.
    <ul className="mt-2 space-y-1.5">
      {sorted.map((availability) => (
        <li
          key={availability.id}
          className="flex items-center justify-between gap-3 text-xs text-text-muted"
        >
          <span className="min-w-0 truncate font-medium text-text-main">
            {tDay(availability.dayOfWeek)}
          </span>
          {/* shrink-0 + nowrap: the range has spaces around the dash, so it is
              a legal break point and wraps mid-range next to a long localised
              day name. tabular-nums lines the times up into a column. */}
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap tabular-nums">
            <Clock className="h-3 w-3 shrink-0" />
            {availability.startTime} – {availability.endTime}
          </span>
        </li>
      ))}
    </ul>
  );
}
