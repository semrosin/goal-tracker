/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';

import { ProgressBar } from './ProgressBar';
import styles from './ProgressBar.module.scss';

describe('ProgressBar', () => {
  it('exposes its percentage to assistive technologies', () => {
    render(<ProgressBar value={42.5} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '42.5'
    );
  });

  it('uses the success tone when requested', () => {
    render(<ProgressBar tone="success" value={100} />);

    expect(screen.getByRole('progressbar')).toHaveClass(styles.success);
  });

  it('uses the light tone when requested', () => {
    render(<ProgressBar tone="light" value={50} />);

    expect(screen.getByRole('progressbar')).toHaveClass(styles.light);
  });
});
