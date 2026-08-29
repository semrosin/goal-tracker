import { render, screen } from '@testing-library/react';

import { Field } from './Field';

describe('Field', () => {
  it('connects a validation message to its native input', () => {
    render(<Field label="Название цели" error="Введите название" />);

    const input = screen.getByRole('textbox', { name: 'Название цели' });
    const error = screen.getByText('Введите название');

    expect(input).toHaveAttribute('aria-describedby', error.id);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
