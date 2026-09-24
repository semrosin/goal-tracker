import { useState } from 'react';
import type { FormEvent } from 'react';

import { useLedgerCommands, useLedgerSelector } from '../../../entities/ledger';
import {
  calculateBalance,
  type TransactionType,
} from '../../../entities/transaction';
import { createTimestamp } from '../../../shared/lib/date';
import { createId } from '../../../shared/lib/id';
import { useI18n } from '../../../shared/lib/i18n';
import { isPositiveInteger } from '../../../shared/lib/validation';
import { Button } from '../../../shared/ui/Button/Button';
import { Field } from '../../../shared/ui/Field/Field';
import styles from './TransactionForm.module.scss';

type TransactionFormProps = { goalId: string; isCompleted?: boolean };

export const TransactionForm = ({
  goalId,
  isCompleted = false,
}: TransactionFormProps) => {
  const { t } = useI18n();
  const commands = useLedgerCommands();
  const balance = useLedgerSelector((state) =>
    calculateBalance(goalId, state.transactions)
  );
  const [type, setType] = useState<TransactionType>('deposit');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const selectType = (nextType: TransactionType) => {
    setType(nextType);
    setError(undefined);
    commands.clearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!isPositiveInteger(numericAmount)) {
      setError(t('transaction.invalidAmount'));
      return;
    }

    if (type === 'withdrawal' && numericAmount > balance) {
      setError(t('transaction.overBalance'));
      return;
    }

    setSubmitting(true);
    try {
      await commands.createTransaction({
        id: createId('transaction'),
        goalId,
        type,
        amount: numericAmount,
        createdAt: createTimestamp(),
      });
      setAmount('');
      setError(undefined);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t('transaction.addError')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="transaction-form-title"
      className={`${styles.panel} ${
        isCompleted ? styles.completedSurface : styles.activeSurface
      }`}
    >
      <h2 id="transaction-form-title">{t('transaction.title')}</h2>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div
          aria-label={t('transaction.type')}
          className={styles.typePicker}
          role="group"
        >
          <Button
            aria-pressed={type === 'deposit'}
            className={type === 'deposit' ? styles.selected : undefined}
            onClick={() => selectType('deposit')}
            variant="secondary"
          >
            {t('transaction.depositAction')}
          </Button>
          <Button
            aria-pressed={type === 'withdrawal'}
            className={type === 'withdrawal' ? styles.selected : undefined}
            onClick={() => selectType('withdrawal')}
            variant="secondary"
          >
            {t('transaction.withdrawAction')}
          </Button>
        </div>
        <Field
          error={error}
          inputMode="numeric"
          label={t('transaction.amount')}
          onChange={(event) => setAmount(event.target.value)}
          value={amount}
        />
        <Button disabled={submitting || commands.busy} type="submit">
          {submitting ? t('transaction.adding') : t('transaction.add')}
        </Button>
      </form>
    </section>
  );
};
