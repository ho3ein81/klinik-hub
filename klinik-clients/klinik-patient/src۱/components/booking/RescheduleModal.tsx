'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { formatLocalDate } from '@/lib/utils';
import { getAvailableSlots } from '@/services/availability.service';
import { rescheduleAppointment } from '@/services/appointments.service';
import { ApiError } from '@/lib/api-client';
import type { Appointment, AvailableSlot } from '@/types/domain';

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onRescheduled: () => void;
}

const today = () => formatLocalDate(new Date());

export function RescheduleModal({
  open,
  onClose,
  appointment,
  onRescheduled,
}: RescheduleModalProps) {
  const t = useTranslations('booking');

  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(today());
    setSelectedSlot(null);
    setFormError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !appointment || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot(null);
    getAvailableSlots(appointment.doctorId, date)
      .then((res) => {
        if (!cancelled) setSlots(res);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, appointment, date]);

  if (!appointment) return null;

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setFormError(t('selectSlotFirst'));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await rescheduleAppointment(appointment.id, {
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      onRescheduled();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('rescheduleTitle')}>
      <div className="space-y-4">
        <DatePicker
          label={t('date')}
          minDate={today()}
          value={date}
          onChange={(v) => setDate(v)}
        />

        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-tight text-text-main">
            {t('availableSlots')}
          </label>
          {loadingSlots ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-xs text-text-dimmed">{t('noSlots')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const isSelected =
                  selectedSlot?.startTime === slot.startTime && selectedSlot?.date === slot.date;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${isSelected
                        ? 'border-primary bg-primary-tint text-primary'
                        : 'border-border bg-surface-card text-text-muted hover:bg-surface-bg'
                      }`}
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
          >
            {formError}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="button" isLoading={submitting} onClick={handleSubmit}>
            {t('confirmReschedule')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
