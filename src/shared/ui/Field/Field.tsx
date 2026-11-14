import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import styles from './Field.module.scss';

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  trailing?: ReactNode;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  (
    {
      className,
      error,
      id,
      label,
      trailing,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error === undefined ? undefined : `${inputId}-error`;
    const describedBy =
      [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <div className={styles.inputRow}>
          <input
            {...props}
            ref={ref}
            aria-describedby={describedBy}
            aria-invalid={error === undefined ? undefined : true}
            className={[styles.input, className].filter(Boolean).join(' ')}
            id={inputId}
          />
          {trailing}
        </div>
        {error === undefined ? null : (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Field.displayName = 'Field';
