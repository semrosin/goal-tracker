/// <reference types="@testing-library/jest-dom" />

import { readFileSync } from 'fs';
import { join } from 'path';
import { useState } from 'react';

import { fireEvent, render, screen, within } from '@testing-library/react';

import { Dialog } from './Dialog';
import styles from './Dialog.module.scss';

const DialogHarness = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Открыть диалог
      </button>
      <button type="button">Фоновое действие</button>
      <Dialog
        isOpen={isOpen}
        title="Подтвердить действие"
        onClose={() => setIsOpen(false)}
      >
        <button type="button">Подтвердить</button>
      </Dialog>
    </>
  );
};

const ReRenderingDialogHarness = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [renderVersion, setRenderVersion] = useState(0);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Открыть диалог с перерисовкой
      </button>
      <Dialog
        isOpen={isOpen}
        title="Подтвердить действие"
        onClose={() => setIsOpen(false)}
      >
        <button
          type="button"
          onClick={() => setRenderVersion(renderVersion + 1)}
        >
          Перерисовать диалог
        </button>
      </Dialog>
    </>
  );
};

type StackedDialogHarnessProps = {
  onFirstClose: () => void;
  onNestedClose: () => void;
};

const StackedDialogHarness = ({
  onFirstClose,
  onNestedClose,
}: StackedDialogHarnessProps) => {
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  const [isNestedOpen, setIsNestedOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsFirstOpen(true)}>
        Открыть первый диалог
      </button>
      <Dialog
        isOpen={isFirstOpen}
        title="Первый диалог"
        onClose={() => {
          onFirstClose();
          setIsFirstOpen(false);
        }}
      >
        <button type="button" onClick={() => setIsNestedOpen(true)}>
          Открыть вложенный диалог
        </button>
        <Dialog
          isOpen={isNestedOpen}
          title="Вложенный диалог"
          onClose={() => {
            onNestedClose();
            setIsNestedOpen(false);
          }}
        >
          <button type="button">Вложенное действие</button>
        </Dialog>
      </Dialog>
    </>
  );
};

const InitiallyStackedDialogHarness = ({
  onFirstClose,
  onNestedClose,
}: StackedDialogHarnessProps) => {
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [isNestedOpen, setIsNestedOpen] = useState(true);

  return (
    <Dialog
      isOpen={isFirstOpen}
      title="Первый начальный диалог"
      onClose={() => {
        onFirstClose();
        setIsFirstOpen(false);
      }}
    >
      <button type="button">Первое начальное действие</button>
      <Dialog
        isOpen={isNestedOpen}
        title="Вложенный начальный диалог"
        onClose={() => {
          onNestedClose();
          setIsNestedOpen(false);
        }}
      >
        <button type="button">Вложенное начальное действие</button>
      </Dialog>
    </Dialog>
  );
};

const openDialog = () => {
  const opener = screen.getByRole('button', { name: 'Открыть диалог' });
  opener.focus();
  fireEvent.click(opener);

  const closeButton = screen.getByRole('button', { name: 'Закрыть' });

  return {
    backgroundControl: screen.getByRole('button', {
      name: 'Фоновое действие',
    }),
    closeButton,
    confirmButton: screen.getByRole('button', { name: 'Подтвердить' }),
    opener,
  };
};

describe('Dialog', () => {
  describe('keyboard modal behavior', () => {
    it('moves focus from its opener to the close control when it opens', () => {
      render(<DialogHarness />);

      const { closeButton } = openDialog();

      expect(closeButton).toHaveFocus();
    });

    it('wraps Tab from the last dialog control to the first without reaching the background', () => {
      render(<DialogHarness />);

      const { backgroundControl, closeButton, confirmButton } = openDialog();
      confirmButton.focus();
      fireEvent.keyDown(confirmButton, { key: 'Tab' });

      expect(closeButton).toHaveFocus();
      expect(backgroundControl).not.toHaveFocus();
    });

    it('wraps Shift+Tab from the first dialog control to the last', () => {
      render(<DialogHarness />);

      const { closeButton, confirmButton } = openDialog();
      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });

      expect(confirmButton).toHaveFocus();
    });

    it('restores focus to the opener after closing with the close control', () => {
      render(<DialogHarness />);

      const { closeButton, opener } = openDialog();
      fireEvent.click(closeButton);

      expect(opener).toHaveFocus();
    });

    it('restores focus to the opener after closing with Escape', () => {
      render(<DialogHarness />);

      const { opener } = openDialog();
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(opener).toHaveFocus();
    });

    it('keeps focus inside when an open parent re-renders with a new close callback', () => {
      render(<ReRenderingDialogHarness />);

      const opener = screen.getByRole('button', {
        name: 'Открыть диалог с перерисовкой',
      });
      opener.focus();
      fireEvent.click(opener);

      const closeButton = screen.getByRole('button', { name: 'Закрыть' });
      const rerenderButton = screen.getByRole('button', {
        name: 'Перерисовать диалог',
      });
      expect(closeButton).toHaveFocus();

      rerenderButton.focus();
      fireEvent.click(rerenderButton);

      expect(rerenderButton).toHaveFocus();
    });

    it('routes Tab and Escape only to the topmost nested dialog', () => {
      const onFirstClose = jest.fn();
      const onNestedClose = jest.fn();
      render(
        <StackedDialogHarness
          onFirstClose={onFirstClose}
          onNestedClose={onNestedClose}
        />
      );

      const firstOpener = screen.getByRole('button', {
        name: 'Открыть первый диалог',
      });
      firstOpener.focus();
      fireEvent.click(firstOpener);

      const nestedOpener = screen.getByRole('button', {
        name: 'Открыть вложенный диалог',
      });
      nestedOpener.focus();
      fireEvent.click(nestedOpener);

      const nestedDialog = screen.getByRole('dialog', {
        name: 'Вложенный диалог',
      });
      const nestedCloseButton = within(nestedDialog).getByRole('button', {
        name: 'Закрыть',
      });
      const nestedAction = within(nestedDialog).getByRole('button', {
        name: 'Вложенное действие',
      });
      expect(nestedCloseButton).toHaveFocus();

      nestedAction.focus();
      fireEvent.keyDown(nestedAction, { key: 'Tab' });
      expect(nestedCloseButton).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onFirstClose).not.toHaveBeenCalled();
      expect(onNestedClose).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole('dialog', { name: 'Вложенный диалог' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('dialog', { name: 'Первый диалог' })
      ).toBeInTheDocument();
      expect(nestedOpener).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onFirstClose).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole('dialog', { name: 'Первый диалог' })
      ).not.toBeInTheDocument();
      expect(firstOpener).toHaveFocus();
    });

    it('focuses and traps Tab in the nested dialog when both dialogs mount open', () => {
      render(
        <InitiallyStackedDialogHarness
          onFirstClose={jest.fn()}
          onNestedClose={jest.fn()}
        />
      );

      const nestedDialog = screen.getByRole('dialog', {
        name: 'Вложенный начальный диалог',
      });
      const nestedCloseButton = within(nestedDialog).getByRole('button', {
        name: 'Закрыть',
      });
      const nestedAction = within(nestedDialog).getByRole('button', {
        name: 'Вложенное начальное действие',
      });
      expect(nestedCloseButton).toHaveFocus();

      nestedAction.focus();
      fireEvent.keyDown(nestedAction, { key: 'Tab' });

      expect(nestedCloseButton).toHaveFocus();
    });

    it('routes Escape only to the nested dialog when both dialogs mount open', () => {
      const onFirstClose = jest.fn();
      const onNestedClose = jest.fn();
      render(
        <InitiallyStackedDialogHarness
          onFirstClose={onFirstClose}
          onNestedClose={onNestedClose}
        />
      );

      const nestedDialog = screen.getByRole('dialog', {
        name: 'Вложенный начальный диалог',
      });
      const nestedAction = within(nestedDialog).getByRole('button', {
        name: 'Вложенное начальное действие',
      });
      nestedAction.focus();
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onFirstClose).not.toHaveBeenCalled();
      expect(onNestedClose).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole('dialog', { name: 'Первый начальный диалог' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('dialog', { name: 'Вложенный начальный диалог' })
      ).not.toBeInTheDocument();
    });
  });

  it('closes when Escape is pressed', () => {
    const onClose = jest.fn();
    render(
      <Dialog isOpen title="Удалить" onClose={onClose}>
        Это действие нельзя отменить.
      </Dialog>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('provides a labelled modal dialog', () => {
    render(
      <Dialog isOpen title="Удалить" onClose={jest.fn()}>
        Это действие нельзя отменить.
      </Dialog>
    );

    expect(screen.getByRole('dialog', { name: 'Удалить' })).toHaveAttribute(
      'aria-modal',
      'true'
    );
  });

  it('keeps the accessible close name on its dedicated close target', () => {
    render(
      <Dialog isOpen title="Удалить" onClose={jest.fn()}>
        Это действие нельзя отменить.
      </Dialog>
    );

    const closeButton = screen.getByRole('button', { name: 'Закрыть' });

    expect(closeButton).toHaveAccessibleName('Закрыть');
    expect(closeButton).toHaveClass(styles.closeButton);
  });

  it('keeps the dedicated close target at least 44 by 44 pixels', () => {
    const source = readFileSync(join(__dirname, 'Dialog.module.scss'), 'utf8');
    const closeButtonRules = source.match(
      /\.closeButton\s*\{([\s\S]*?)\}/
    )?.[1];

    expect(closeButtonRules).toBeDefined();
    expect(closeButtonRules).toMatch(/min-width\s*:\s*44px/);
    expect(closeButtonRules).toMatch(/min-height\s*:\s*44px/);
  });
});
