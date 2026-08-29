import type { ButtonHTMLAttributes } from 'react';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export const Button = ({
  className,
  fullWidth = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={[styles.button, styles[variant], fullWidth ? styles.fullWidth : '', className]
      .filter(Boolean)
      .join(' ')}
    type={type}
  />
);
