import { test, expect } from '@playwright/test';

async function expectLigatures(page, text) {
  const rendered = await text.screenshot();
  const style = await page.addStyleTag({ content: '* { font-variant-ligatures: none !important; }' });
  expect(await text.screenshot()).not.toEqual(rendered);
  await style.evaluate(element => element.remove());
}

test('long operator ligatures render in prose while preserving source and link destinations', async ({ page }) => {
  await page.goto('/text-symbols/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { name: 'Operators -> != => <=', exact: true })).toBeVisible();
  const prose = page.getByText('In prose: a -> b, a != b, a => b, a <= b.', { exact: true });
  await expect(prose).toBeVisible();
  await expectLigatures(page, prose);
  await prose.evaluate(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
  });
  expect(await page.evaluate(() => getSelection().toString())).toBe('In prose: a -> b, a != b, a => b, a <= b.');
  const link = page.getByRole('link', { name: 'Link -> != => <=', exact: true });
  const destination = new URL(await link.getAttribute('href'), page.url());
  expect(destination.searchParams.get('operators')).toBe('->,!=,=>,<=');
});

test('code, editable source, and scripts retain original operators', async ({ page }) => {
  await page.goto('/text-symbols/');
  await expect(page.getByLabel('Editable source')).toHaveValue('a -> b != c => d <= e');
  expect(await page.evaluate(() => window.symbolScriptResult)).toBe('-> != => <=');
  for (const source of ['a -> b', 'a != b', 'a => b', 'a <= b']) {
    await expect(page.locator('p > code').filter({ hasText: source })).toHaveText(source);
  }
  await expect(page.getByRole('region', { name: 'operators.txt', exact: true })).toHaveText('a -> b\na != b\na => b\na <= b');
});

test('newly displayed text also renders long operator ligatures', async ({ page }) => {
  await page.goto('/text-symbols/');
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  const added = page.getByText('Added -> != => <=', { exact: true });
  await expect(added).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expectLigatures(page, added);
});
