import { fireEvent, render, screen } from '@testing-library/react';

import { Dialog } from './Dialog';

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

    expect(closeButton).toHaveClass('closeButton');
    expect(closeButton).toHaveAccessibleName('Закрыть');
  });
});
