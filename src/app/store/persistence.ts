import {
  decodeLedgerState,
  serializeLedgerState,
  type LedgerState,
} from '../../entities/ledger';
import { readJson, writeJson } from '../../shared/lib/storage/safeStorage';

export const STORAGE_KEY = 'goal-tracker-state';
export const DEMO_STORAGE_KEY = 'goal-tracker-demo-state';

const isLedgerState = (value: unknown): value is LedgerState =>
  decodeLedgerState(value) !== undefined;

export const loadPersistedState = (
  key: string = STORAGE_KEY
): LedgerState | undefined => {
  const persistedState = readJson(key, isLedgerState);
  if (persistedState === null) return undefined;

  return decodeLedgerState(persistedState);
};

export const savePersistedState = (
  state: LedgerState,
  key: string = STORAGE_KEY
): void => {
  writeJson(key, serializeLedgerState(state));
};
