'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { FLOATING_PANEL_ATTR, useCloseOnOutsideOrEscape, useFloatingPanel } from '@/hooks/useFloatingPanel';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;
  helperText?: string;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  errorMessage,
  helperText,
  className = '',
}: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { triggerRef, panelRef, position } = useFloatingPanel(open);
  useCloseOnOutsideOrEscape(open, [triggerRef, panelRef], () => setOpen(false));

  const selected = options.find((o) => o.value === value);
  const hasError = Boolean(errorMessage);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-text-main tracking-tight select-none">
          {label}
        </label>
      )}

      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`select-trigger ${!selected ? 'select-trigger--placeholder' : ''} ${hasError ? 'select-trigger--error' : ''} ${className}`}
      >
        <span className="truncate">{selected ? selected.label : (placeholder ?? '')}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-dimmed transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            {...{ [FLOATING_PANEL_ATTR]: true }}
            className="select-panel panel-enter fixed z-110"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return;
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`select-option ${isSelected ? 'select-option--selected' : ''}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
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
