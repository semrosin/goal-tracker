import styles from './ProgressBar.module.scss';

export type ProgressBarProps = {
  value: number;
  label?: string;
};

const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export const ProgressBar = ({
  label = 'Прогресс цели',
  value,
}: ProgressBarProps) => {
  const progress = clampProgress(value);

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      className={styles.track}
      role="progressbar"
    >
      <div className={styles.value} style={{ width: `${progress}%` }} />
    </div>
  );
};
