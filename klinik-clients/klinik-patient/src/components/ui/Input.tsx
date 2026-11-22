import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorMessage?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      errorMessage,
      helperText,
      leftIcon,
      rightIcon,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(errorMessage);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-text-main tracking-tight select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-dimmed">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full h-11 px-3.5 text-sm rounded-xl bg-surface-card border transition-all duration-150
              placeholder:text-text-dimmed text-text-main
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-bg
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${leftIcon ? 'pl-9' : ''}
              ${rightIcon ? 'pr-9' : ''}
              ${hasError
                ? 'border-status-rejected-fg focus:border-status-rejected-fg focus:ring-status-rejected-bg'
                : 'border-border focus:border-primary focus:ring-primary-tint'
              }
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center text-text-dimmed">
              {rightIcon}
            </div>
          )}
        </div>

        {hasError ? (
          <p className="text-xs text-status-rejected-fg mt-0.5 animate-fadeIn">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p className="text-xs text-text-muted mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
