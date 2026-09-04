/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';

import { Button } from './Button';

describe('Button', () => {
  it('does not submit a parent form unless explicitly requested', () => {
    render(
      <form>
        <Button>Сохранить</Button>
      </form>
    );

    expect(screen.getByRole('button', { name: 'Сохранить' })).toHaveAttribute(
      'type',
      'button'
    );
  });
});
