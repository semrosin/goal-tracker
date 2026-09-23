import { createAction, type UnknownAction } from '@reduxjs/toolkit';

import {
  decodeLedgerState,
  ledgerInitialState,
  ledgerReducer,
  type LedgerState,
} from '../../entities/ledger';

export type RootState = LedgerState;
export const rootInitialState = ledgerInitialState;
export const ledgerReplaced = createAction<LedgerState>('ledger/replaced');

export const rootReducer = (
  state: RootState = rootInitialState,
  action: UnknownAction
): RootState => {
  if (ledgerReplaced.match(action)) {
    return decodeLedgerState(action.payload) ?? state;
  }
  return ledgerReducer(state, action);
};
