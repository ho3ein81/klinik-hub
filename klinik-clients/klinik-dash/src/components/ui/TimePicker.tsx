'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { TimeFields } from './TimeFields';
import { FLOATING_PANEL_ATTR, useCloseOnOutsideOrEscape, useFloatingPanel } from '@/hooks/useFloatingPanel';

interface TimePickerProps {
  label?: string;
  /** 'HH:mm', 24-hour, or '' */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  errorMessage?: string;
  helperText?: string;
  placeholder?: string;
}

/** A 12-hour AM/PM time-only picker — the standalone counterpart to <DatePicker showTime>. */
export function TimePicker({
  label,
  value,
  onChange,
  disabled,
  errorMessage,
  helperText,
  placeholder,
}: TimePickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { triggerRef, panelRef, position } = useFloatingPanel(open);
  useCloseOnOutsideOrEscape(open, [triggerRef, panelRef], () => setOpen(false));

  const [hourStr, minuteStr] = value ? value.split(':') : ['', ''];
  const hasValue = hourStr !== '' && minuteStr !== '';
  const hour24 = hasValue ? Number(hourStr) : 9;
  const minute = hasValue ? Number(minuteStr) : 0;

  const commit = (nextHour24: number, nextMinute: number) => {
    onChange(`${String(nextHour24).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);
  };

  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const displayValue = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;

  const hasError = Boolean(errorMessage);

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
          onClick={() => setOpen((o) => !o)}
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
          <span className={hasValue ? 'text-text-main' : 'text-text-dimmed'}>
            {hasValue ? displayValue : (placeholder ?? '')}
          </span>
        </button>
        <span className="pointer-events-none absolute end-3 flex items-center text-text-dimmed">
          <Clock className="h-4 w-4" />
        </span>
      </div>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            {...{ [FLOATING_PANEL_ATTR]: true }}
            className="calendar-panel panel-enter fixed z-110"
            style={{ top: position.top, left: position.left }}
          >
            <TimeFields hour24={hour24} minute={minute} onChange={commit} bordered={false} />
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
