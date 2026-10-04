import { test, expect } from '@playwright/test';

const source = 'square(2) + square(3)\n> (2 * 2) + (3 * 3)\n> (4) + (9)\n> 13';

test('multiline code selects exact source by dragging', async ({ page }) => {
  await page.goto('/code-selection/');
  const block = page.getByRole('group', { name: 'Code: evaluation', exact: true });
  const first = await block.getByText('square(2) + square(3)', { exact: true }).boundingBox();
  const last = await block.getByText('> 13', { exact: true }).boundingBox();
  await page.mouse.move(first.x, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width + 1, last.y + last.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => getSelection().toString())).toBe(source);
});

test('line numbers remain in their gutter while long code scrolls horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/code-blocks/');
  const group = page.getByRole('group', { name: 'Code files', exact: true }).first();
  const panel = group.getByRole('tabpanel');
  const number = panel.getByText('1', { exact: true });
  const before = await number.boundingBox();
  await panel.evaluate(p => { p.scrollLeft = 200; });
  await expect.poll(() => panel.evaluate(p => p.scrollLeft)).toBeGreaterThan(0);
  const after = await number.boundingBox();
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.width).toBeCloseTo(before.width, 0);
});
