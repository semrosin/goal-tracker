import { render, screen } from '@testing-library/react';

import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes its percentage to assistive technologies', () => {
    render(<ProgressBar value={42.5} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42.5');
  });
});
