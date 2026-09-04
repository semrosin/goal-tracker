/// <reference types="@testing-library/jest-dom" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { screen } from '@testing-library/react';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { GoalSummary } from './GoalSummary';

test('shows a goal description when it is provided', () => {
  const goal = {
    id: 'goal-1',
    title: 'Отпуск',
    description: 'Хочу увидеть океан.',
    targetAmount: 100_000,
    createdAt: '2026-09-04T00:00:00.000Z',
  };

  renderWithLedger(<GoalSummary goal={goal} />, {
    goals: [goal],
    transactions: [],
  });

  expect(screen.getByText('Хочу увидеть океан.')).toBeInTheDocument();
});

test('aligns the target amount with the right edge', () => {
  const source = readFileSync(join(__dirname, 'GoalSummary.module.scss'), 'utf8');
  const targetAmountRules = source.match(
    /\.amounts div:last-child\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(targetAmountRules).toBeDefined();
  expect(targetAmountRules).toMatch(/align-items\s*:\s*flex-end/);
});

test('wraps a long amount within its grid cell', () => {
  const source = readFileSync(join(__dirname, 'GoalSummary.module.scss'), 'utf8');
  const amountRules = source.match(
    /\.amounts strong\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(amountRules).toBeDefined();
  expect(amountRules).toMatch(/max-width\s*:\s*100%/);
  expect(amountRules).toMatch(/overflow-wrap\s*:\s*anywhere/);
});

test('allows amount cells to shrink within the summary grid', () => {
  const source = readFileSync(join(__dirname, 'GoalSummary.module.scss'), 'utf8');
  const amountCellRules = source.match(/\.amounts div\s*\{([\s\S]*?)\}/)?.[1];

  expect(amountCellRules).toBeDefined();
  expect(amountCellRules).toMatch(/min-width\s*:\s*0/);
});
