import { expect, test } from '@playwright/test';

test('goal states remain usable with long names and keyboard navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
    localStorage.setItem(
      'goal-tracker-demo-state',
      JSON.stringify({
        goals: [
          {
            id: 'past',
            title: 'A very long goal name '.repeat(5),
            targetAmount: 1000000,
            targetMonth: '2020-01',
            createdAt: '2019-01-01T00:00:00.000Z',
          },
          {
            id: 'done',
            title: 'Completed goal',
            targetAmount: 100,
            targetMonth: '2020-01',
            createdAt: '2019-01-01T00:00:00.000Z',
          },
        ],
        transactions: [
          {
            id: 'done-deposit',
            goalId: 'done',
            type: 'deposit',
            amount: 100,
            createdAt: '2019-01-02T00:00:00.000Z',
          },
        ],
      })
    );
  });
  await page.goto('/goals/past');
  await expect(page.getByText('Past the target month')).toBeVisible();
  await expect(
    page.getByText('No transactions yet. Add a deposit to begin.')
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  const edit = page.getByRole('button', { name: 'Edit', exact: true });
  await edit.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(edit).toBeFocused();
  await page.goto('/goals/done');
  await expect(page.getByText('Goal reached')).toBeVisible();
  await expect(page.getByText('Past the target month')).toHaveCount(0);
});
