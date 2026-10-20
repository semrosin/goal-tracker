import { useId } from 'react';

import type { ProfileStatistics } from '../../../entities/ledger';
import { useI18n } from '../../../shared/lib/i18n';
import { formatMoney, type Currency } from '../../../shared/lib/money';
import styles from './ProfilePage.module.scss';

export const StatisticsCharts = ({
  statistics,
  currency,
}: {
  statistics: ProfileStatistics;
  currency: Currency;
}) => {
  const { locale, t } = useI18n();
  const gradientId = useId();
  const { months } = statistics;
  const money = (value: number) => formatMoney(value, currency, locale);
  const monthFormatter = new Intl.DateTimeFormat(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    { month: 'short' }
  );
  const label = (month: string) =>
    monthFormatter.format(new Date(`${month}-01T12:00:00`));
  const compact = new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const balanceMax = Math.max(1, ...months.map((month) => month.balance));
  const activityMax = Math.max(
    1,
    ...months.flatMap((month) => [month.deposits, month.withdrawals])
  );
  const x = (index: number) => 96 + index * 86;
  const y = (value: number, max: number) => 204 - (value / max) * 160;
  const points = months
    .map((month, index) => `${x(index)},${y(month.balance, balanceMax)}`)
    .join(' ');

  return (
    <>
      <section className={styles.panel} aria-label={t('profile.balanceChart')}>
        <h3>{t('profile.balanceChart')}</h3>
        <p className={styles.hint}>{t('profile.period', { currency })}</p>
        <svg
          className={styles.chart}
          viewBox="0 0 590 250"
          role="img"
          aria-label={t('profile.balanceChart')}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c8fff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#7c8fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1="66"
                x2="556"
                y1={y(ratio, 1)}
                y2={y(ratio, 1)}
                className={styles.gridLine}
              />
              <text x="54" y={y(ratio, 1) + 4} textAnchor="end">
                {compact.format(
                  balanceMax === 1 && statistics.saved === 0
                    ? 0
                    : balanceMax * ratio
                )}
              </text>
            </g>
          ))}
          <polygon
            points={`${x(0)},204 ${points} ${x(months.length - 1)},204`}
            fill={`url(#${gradientId})`}
          />
          <polyline
            points={points}
            fill="none"
            stroke="#95a4ff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {months.map((month, index) => (
            <g key={month.month}>
              <circle
                cx={x(index)}
                cy={y(month.balance, balanceMax)}
                r="4.5"
                fill="#b8c2ff"
              >
                <title>
                  {label(month.month)}: {money(month.balance)}
                </title>
              </circle>
              <text x={x(index)} y="237" textAnchor="middle">
                {label(month.month)}
              </text>
            </g>
          ))}
        </svg>
        <p className={styles.chartHint}>{t('profile.balanceHint')}</p>
      </section>
      <section className={styles.panel} aria-label={t('profile.activityChart')}>
        <div className={styles.panelHeading}>
          <div>
            <h3>{t('profile.activityChart')}</h3>
            <p className={styles.hint}>{t('profile.period', { currency })}</p>
          </div>
          <div className={styles.legend}>
            <span>
              <i className={styles.depositDot} />
              {t('history.deposit')}
            </span>
            <span>
              <i className={styles.withdrawalDot} />
              {t('history.withdrawal')}
            </span>
          </div>
        </div>
        <svg
          className={styles.chart}
          viewBox="0 0 590 250"
          role="img"
          aria-label={t('profile.activityChart')}
        >
          {[0, 0.5, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1="66"
                x2="556"
                y1={y(ratio, 1)}
                y2={y(ratio, 1)}
                className={styles.gridLine}
              />
              <text x="54" y={y(ratio, 1) + 4} textAnchor="end">
                {compact.format(
                  activityMax === 1 && statistics.transactionCount === 0
                    ? 0
                    : activityMax * ratio
                )}
              </text>
            </g>
          ))}
          {months.map((month, index) => (
            <g key={month.month}>
              <rect
                x={x(index) - 22}
                y={y(month.deposits, activityMax)}
                width="18"
                height={204 - y(month.deposits, activityMax)}
                rx="3"
                fill="#61d8b3"
              >
                <title>
                  {label(month.month)} · {t('history.deposit')}:{' '}
                  {money(month.deposits)}
                </title>
              </rect>
              <rect
                x={x(index) + 4}
                y={y(month.withdrawals, activityMax)}
                width="18"
                height={204 - y(month.withdrawals, activityMax)}
                rx="3"
                fill="#f0aa83"
              >
                <title>
                  {label(month.month)} · {t('history.withdrawal')}:{' '}
                  {money(month.withdrawals)}
                </title>
              </rect>
              <text x={x(index)} y="237" textAnchor="middle">
                {label(month.month)}
              </text>
            </g>
          ))}
        </svg>
      </section>
      <details className={styles.chartDetails}>
        <summary>{t('profile.chartData')}</summary>
        <div className={styles.tableScroll}>
          <table aria-label={t('profile.chartData')}>
            <thead>
              <tr>
                <th scope="col">{t('profile.month')}</th>
                <th scope="col">{t('history.deposit')}</th>
                <th scope="col">{t('history.withdrawal')}</th>
                <th scope="col">{t('profile.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.month}>
                  <th scope="row">
                    {label(month.month)} {month.month.slice(0, 4)}
                  </th>
                  <td>{money(month.deposits)}</td>
                  <td>{money(month.withdrawals)}</td>
                  <td>{money(month.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
};
