import { shallowEqual } from 'react-redux';

import { useLedgerSelector } from '../../../entities/ledger';
import { DeleteTransactionButton } from '../../../features/delete-transaction';
import { formatDate } from '../../../shared/lib/date';
import { useI18n } from '../../../shared/lib/i18n';
import { formatRubles } from '../../../shared/lib/money';
import styles from './TransactionsHistory.module.scss';

type TransactionsHistoryProps = { goalId: string; isCompleted?: boolean };
export const TransactionsHistory = ({
  goalId,
  isCompleted = false,
}: TransactionsHistoryProps) => {
  const { locale, t } = useI18n();
  const transactions = useLedgerSelector(
    (state) =>
      state.transactions
        .filter((transaction) => transaction.goalId === goalId)
        .slice()
        .reverse(),
    shallowEqual
  );
  return (
    <section
      aria-labelledby="transactions-history-title"
      className={`${styles.panel} ${
        isCompleted ? styles.completedSurface : styles.activeSurface
      }`}
    >
      <h2 id="transactions-history-title">{t('history.title')}</h2>
      {transactions.length === 0 ? (
        <p className={styles.empty}>{t('history.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {transactions.map((transaction) => {
            const isDeposit = transaction.type === 'deposit';
            const formattedDate = formatDate(transaction.createdAt, locale);
            const signedAmount = `${isDeposit ? '+' : '-'}${formatRubles(
              transaction.amount,
              locale
            )}`;
            return (
              <li className={styles.item} key={transaction.id}>
                <div className={styles.details}>
                  <strong>
                    {t(isDeposit ? 'history.deposit' : 'history.withdrawal')}
                  </strong>
                  <span>{formattedDate}</span>
                </div>
                <strong
                  className={isDeposit ? styles.deposit : styles.withdrawal}
                >
                  {signedAmount}
                </strong>
                <DeleteTransactionButton
                  ariaLabel={t('history.deleteLabel', {
                    type: t(
                      isDeposit
                        ? 'history.depositObject'
                        : 'history.withdrawalObject'
                    ),
                    amount: signedAmount,
                    date: formattedDate,
                    id: transaction.id,
                  })}
                  transactionId={transaction.id}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
