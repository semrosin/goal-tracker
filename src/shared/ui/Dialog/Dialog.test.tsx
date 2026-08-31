import { readFileSync } from 'fs';
import { join } from 'path';

import { fireEvent, render, screen } from '@testing-library/react';

import { Dialog } from './Dialog';
import styles from './Dialog.module.scss';

describe('Dialog', () => {
  it('closes when Escape is pressed', () => {
    const onClose = jest.fn();
    render(
      <Dialog isOpen title="Удалить цель" onClose={onClose}>
        Это действие нельзя отменить.
      </Dialog>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('provides a labelled modal dialog', () => {
    render(
      <Dialog isOpen title="Удалить цель" onClose={jest.fn()}>
        Это действие нельзя отменить.
      </Dialog>
    );

    expect(
      screen.getByRole('dialog', { name: 'Удалить цель' })
    ).toHaveAttribute('aria-modal', 'true');
  });

  it('keeps the accessible close name on its dedicated close target', () => {
    render(
      <Dialog isOpen title="Удалить цель" onClose={jest.fn()}>
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
