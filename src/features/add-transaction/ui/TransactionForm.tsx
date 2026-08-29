import { useState } from 'react';
import type { FormEvent } from 'react';

import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { calculateBalance } from '../../../entities/transaction/model/selectors';
import { transactionsActions } from '../../../entities/transaction/model/transactionSlice';
import type { TransactionType } from '../../../entities/transaction/model/types';
import { createTimestamp } from '../../../shared/lib/date';
import { createId } from '../../../shared/lib/id';
import { isPositiveInteger } from '../../../shared/lib/validation';
import { Button } from '../../../shared/ui/Button/Button';
import { Field } from '../../../shared/ui/Field/Field';
import styles from './TransactionForm.module.scss';

type TransactionFormProps = { goalId: string };

const invalidAmountMessage = 'Укажите положительную целую сумму';
const overBalanceMessage = 'Нельзя снять больше, чем накоплено';

export const TransactionForm = ({ goalId }: TransactionFormProps) => {
  const dispatch = useAppDispatch();
  const balance = useAppSelector((state) =>
    calculateBalance(goalId, state.transactions)
  );
  const [type, setType] = useState<TransactionType>('deposit');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();

  const selectType = (nextType: TransactionType) => {
    setType(nextType);
    setError(undefined);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!isPositiveInteger(numericAmount)) {
      setError(invalidAmountMessage);
      return;
    }

    if (type === 'withdrawal' && numericAmount > balance) {
      setError(overBalanceMessage);
      return;
    }

    dispatch(
      transactionsActions.transactionCreated({
        id: createId('transaction'),
        goalId,
        type,
        amount: numericAmount,
        createdAt: createTimestamp(),
      })
    );
    setAmount('');
    setError(undefined);
  };

  return (
    <section aria-labelledby="transaction-form-title" className={styles.panel}>
      <h2 id="transaction-form-title">Добавить операцию</h2>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div
          aria-label="Тип операции"
          className={styles.typePicker}
          role="group"
        >
          <Button
            aria-pressed={type === 'deposit'}
            onClick={() => selectType('deposit')}
            variant="secondary"
          >
            Пополнить
          </Button>
          <Button
            aria-pressed={type === 'withdrawal'}
            onClick={() => selectType('withdrawal')}
            variant="secondary"
          >
            Снять
          </Button>
        </div>
        <Field
          error={error}
          inputMode="numeric"
          label="Сумма"
          onChange={(event) => setAmount(event.target.value)}
          value={amount}
        />
        <Button type="submit">Добавить операцию</Button>
      </form>
    </section>
  );
};
