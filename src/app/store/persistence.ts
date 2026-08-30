import {
  decodeLedgerState,
  serializeLedgerState,
  type LedgerState,
} from '../../entities/ledger/model/ledger';
import { readJson, writeJson } from '../../shared/lib/storage/safeStorage';

export const STORAGE_KEY = 'goal-tracker-state';

const isLedgerState = (value: unknown): value is LedgerState =>
  decodeLedgerState(value) !== undefined;

export const loadPersistedState = (): LedgerState | undefined => {
  const persistedState = readJson(STORAGE_KEY, isLedgerState);
  if (persistedState === null) return undefined;

  return decodeLedgerState(persistedState);
};

export const savePersistedState = (state: LedgerState): void => {
  writeJson(STORAGE_KEY, serializeLedgerState(state));
};
