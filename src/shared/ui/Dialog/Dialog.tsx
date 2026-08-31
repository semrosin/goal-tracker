import { useEffect, useId, useRef } from 'react';
import type { PropsWithChildren } from 'react';

import { Button } from '../Button/Button';
import styles from './Dialog.module.scss';

export type DialogProps = PropsWithChildren<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
}>;

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type DialogRegistration = {
  dialog: HTMLElement;
};

const activeDialogs: DialogRegistration[] = [];

const registerDialog = (dialog: HTMLElement) => {
  const registration = { dialog };
  const dialogIndex = activeDialogs.findIndex(({ dialog: activeDialog }) =>
    Boolean(
      dialog.compareDocumentPosition(activeDialog) &
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  );

  if (dialogIndex === -1) activeDialogs.push(registration);
  else activeDialogs.splice(dialogIndex, 0, registration);

  return {
    isTopmost: () => {
      if (dialog.isConnected) {
        const modalDialogs = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[role="dialog"][aria-modal="true"]'
          )
        );

        return modalDialogs[modalDialogs.length - 1] === dialog;
      }

      return activeDialogs[activeDialogs.length - 1] === registration;
    },
    unregister: () => {
      const activeDialogIndex = activeDialogs.indexOf(registration);

      if (activeDialogIndex !== -1) activeDialogs.splice(activeDialogIndex, 1);
    },
  };
};

export const Dialog = ({ children, isOpen, onClose, title }: DialogProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const opener = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const registration = registerDialog(dialog);
    const closeButton = dialog.querySelector<HTMLButtonElement>(
      '[aria-label="Закрыть"]'
    );

    if (registration.isTopmost()) closeButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!registration.isTopmost()) return;

      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true');

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      if (currentIndex === -1) {
        event.preventDefault();
        (event.shiftKey ? lastFocusableElement : firstFocusableElement).focus();
        return;
      }

      if (
        (event.shiftKey && currentIndex === 0) ||
        (!event.shiftKey && currentIndex === focusableElements.length - 1)
      ) {
        event.preventDefault();
        (event.shiftKey ? lastFocusableElement : firstFocusableElement).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const wasTopmost = registration.isTopmost();
      registration.unregister();

      if (wasTopmost && opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <Button
            aria-label="Закрыть"
            className={styles.closeButton}
            onClick={onClose}
            variant="secondary"
          >
            ×
          </Button>
        </div>
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  );
};
