import { shallowEqual } from 'react-redux';

import { useLedgerSelector } from '../../../entities/ledger';
import { type Transaction } from '../../../entities/transaction';
import { DeleteTransactionButton } from '../../../features/delete-transaction';
import { formatDate } from '../../../shared/lib/date';
import { formatRubles } from '../../../shared/lib/money';
import styles from './TransactionsHistory.module.scss';

type TransactionsHistoryProps = { goalId: string };
const transactionLabels: Record<Transaction['type'], string> = {
  deposit: 'Пополнение',
  withdrawal: 'Снятие',
};
const transactionDeleteLabels: Record<Transaction['type'], string> = {
  deposit: 'пополнение',
  withdrawal: 'снятие',
};
const sortNewestFirst = (left: Transaction, right: Transaction): number =>
  right.createdAt.localeCompare(left.createdAt) ||
  right.id.localeCompare(left.id);

export const TransactionsHistory = ({ goalId }: TransactionsHistoryProps) => {
  const transactions = useLedgerSelector(
    (state) =>
      state.transactions
        .filter((transaction) => transaction.goalId === goalId)
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
            const formattedDate = formatDate(transaction.createdAt);
            const signedAmount = `${isDeposit ? '+' : '-'}${formatRubles(
              transaction.amount
            )}`;
            return (
              <li className={styles.item} key={transaction.id}>
                <div className={styles.details}>
                  <strong>{transactionLabels[transaction.type]}</strong>
                  <span>{formattedDate}</span>
                </div>
                <strong
                  className={isDeposit ? styles.deposit : styles.withdrawal}
                >
                  {signedAmount}
                </strong>
                <DeleteTransactionButton
                  ariaLabel={`Удалить ${
                    transactionDeleteLabels[transaction.type]
                  } ${signedAmount} от ${formattedDate}, операция ${
                    transaction.id
                  }`}
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
