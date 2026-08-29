import { shallowEqual } from 'react-redux';

import { useAppSelector } from '../../../app/store/hooks';
import { DeleteTransactionButton } from '../../../features/delete-transaction/ui/DeleteTransactionButton';
import { selectTransactionsForGoal } from '../../../entities/transaction/model/selectors';
import type { Transaction } from '../../../entities/transaction/model/types';
import { formatDate } from '../../../shared/lib/date';
import { formatRubles } from '../../../shared/lib/money';
import styles from './TransactionsHistory.module.scss';

type TransactionsHistoryProps = { goalId: string };
const transactionLabels: Record<Transaction['type'], string> = {
  deposit: 'Пополнение',
  withdrawal: 'Снятие',
};
const sortNewestFirst = (left: Transaction, right: Transaction): number =>
  right.createdAt.localeCompare(left.createdAt) ||
  right.id.localeCompare(left.id);

export const TransactionsHistory = ({ goalId }: TransactionsHistoryProps) => {
  const transactions = useAppSelector(
    (state) =>
      selectTransactionsForGoal(state.transactions, goalId)
        .slice()
        .sort(sortNewestFirst),
    shallowEqual
  );
  return (
    <section
      aria-labelledby="transactions-history-title"
      className={styles.panel}
    >
      <h2 id="transactions-history-title">История операций</h2>
      {transactions.length === 0 ? (
        <p className={styles.empty}>Операций пока нет.</p>
      ) : (
        <ul className={styles.list}>
          {transactions.map((transaction) => {
            const isDeposit = transaction.type === 'deposit';
            return (
              <li className={styles.item} key={transaction.id}>
                <div className={styles.details}>
                  <strong>{transactionLabels[transaction.type]}</strong>
                  <span>{formatDate(transaction.createdAt)}</span>
                </div>
                <strong
                  className={isDeposit ? styles.deposit : styles.withdrawal}
                >
                  {isDeposit ? '+' : '-'}
                  {formatRubles(transaction.amount)}
                </strong>
                <DeleteTransactionButton transactionId={transaction.id} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
