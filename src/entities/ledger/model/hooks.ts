import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux';

import type { LedgerState } from './ledger';

export const useLedgerDispatch = () => useDispatch<Dispatch<UnknownAction>>();
export const useLedgerSelector: TypedUseSelectorHook<LedgerState> = useSelector;
