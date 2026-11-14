import { expect, test, type Page } from '@playwright/test';

const openGoals = async (page: Page, count: number) => {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.evaluate((count) => {
    const goals = Array.from({ length: count }, (_, index) => ({
      id: `grid-${index}`,
      title: `Goal ${index + 1}`,
      targetAmount: 1000,
      createdAt: '2026-01-01T00:00:00.000Z',
    }));
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
    localStorage.setItem(
      'goal-tracker-demo-state',
      JSON.stringify({ goals, transactions: [] })
    );
  }, count);
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('main a[href^="/goals/"]');
  await expect(cards).toHaveCount(count);
  return cards;
};

test('goal cards form a consistent grid', async ({ page }, testInfo) => {
  const cards = await openGoals(page, 12);
  const boxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    })
  );

  if (testInfo.project.name === 'mobile') {
    boxes.forEach((box, index) => {
      expect(box.x).toBe(boxes[0].x);
      expect(box.width).toBe(boxes[0].width);
      if (index > 0) expect(box.y).toBeGreaterThan(boxes[index - 1].y);
    });
  } else {
    boxes.forEach((box, index) => {
      expect(box.width).toBeCloseTo(boxes[0].width, 0);
      if (index % 3 === 0 && index > 0) {
        expect(box.y).toBeGreaterThan(boxes[index - 1].y);
      } else if (index % 3 !== 0) {
        expect(box.y).toBe(boxes[index - 1].y);
      }
    });
  }

  await cards.first().click();
  await expect(page).toHaveURL(/\/goals\/grid-0$/);
  await expect(
    page.getByRole('heading', { name: 'Goal 1', exact: true })
  ).toBeVisible();
});

test('partial goal blocks have no overlap, overflow, or empty trailing row', async ({
  page,
}) => {
  for (const count of [1, 2, 3, 5, 6, 7]) {
    const cards = await openGoals(page, count);
    const layout = await cards.evaluateAll((elements) => {
      const boxes = elements.map((element) => element.getBoundingClientRect());
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        bottom: elements[0].parentElement!.getBoundingClientRect().bottom,
        cardBottom: Math.max(...boxes.map((box) => box.bottom)),
        overlaps: boxes.some((a, i) =>
          boxes
            .slice(i + 1)
            .some(
              (b) =>
                a.left < b.right &&
                a.right > b.left &&
                a.top < b.bottom &&
                a.bottom > b.top
            )
        ),
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.overlaps).toBe(false);
    expect(layout.bottom).toBeCloseTo(layout.cardBottom);
  }
});
