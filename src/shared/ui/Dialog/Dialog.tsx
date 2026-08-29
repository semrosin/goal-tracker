import { useEffect, useId } from 'react';
import type { PropsWithChildren } from 'react';

import { Button } from '../Button/Button';
import styles from './Dialog.module.scss';

export type DialogProps = PropsWithChildren<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
}>;

export const Dialog = ({ children, isOpen, onClose, title }: DialogProps) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section aria-labelledby={titleId} aria-modal="true" className={styles.dialog} role="dialog">
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <Button aria-label="Закрыть" className={styles.closeButton} onClick={onClose} variant="secondary">
            ×
          </Button>
        </div>
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  );
};
