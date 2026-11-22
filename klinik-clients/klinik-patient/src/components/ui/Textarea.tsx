import React, { forwardRef, useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  errorMessage?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, errorMessage, helperText, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hasError = Boolean(errorMessage);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-text-main tracking-tight select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full resize-none rounded-xl bg-surface-card px-3.5 py-2.5 text-sm text-text-main border
            focus:outline-none focus:ring-2
            ${hasError
              ? 'border-status-rejected-fg focus:border-status-rejected-fg focus:ring-status-rejected-bg'
              : 'border-border focus:border-primary focus:ring-primary-tint'
            }
            ${className}
          `}
          {...props}
        />

        {hasError ? (
          <p className="text-xs text-status-rejected-fg mt-0.5 animate-fadeIn">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
