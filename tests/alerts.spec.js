import { test, expect } from '@playwright/test';

const labels = ['Note', 'Tip', 'Important', 'Warning', 'Caution'];

test('all five alerts have visible labels and render block Markdown', async ({ page }) => {
  await page.goto('/alerts/');
  await expect(page.getByRole('note')).toHaveCount(5);
  for (const label of labels) {
    const alert = page.getByRole('note', { name: label, exact: true });
    await expect(alert).toBeVisible();
    await expect(alert.getByText(label, { exact: true })).toBeVisible();
  }
  const note = page.getByRole('note', { name: 'Note', exact: true });
  await expect(note.locator('strong')).toHaveText('information');
  await expect(note.locator('em')).toHaveText('emphasis');
  await expect(note.locator('code')).toHaveText('inline code');
  await expect(note.getByText('A second paragraph', { exact: false })).toBeVisible();
  await expect(page.getByRole('note', { name: 'Tip', exact: true }).getByRole('listitem')).toHaveText([
    'First suggestion', 'Second suggestion',
  ]);
  await note.getByRole('link', { name: 'working link' }).click();
  await expect(page).toHaveURL(/#details$/);
});

for (const colorScheme of ['light', 'dark']) {
  test(`alerts have distinct colored borders in ${colorScheme} mode without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme });
    try {
      const page = await context.newPage();
      await page.goto('/alerts/');
      const colors = [];
      for (const label of labels) {
        const alert = page.getByRole('note', { name: label, exact: true });
        await expect(alert).toBeVisible();
        const color = await alert.evaluate(element => {
          const style = getComputedStyle(element);
          return { border: style.borderLeftColor, text: style.color, width: style.borderLeftWidth };
        });
        expect(color.width).toBe('4px');
        expect(color.border).not.toBe(color.text);
        await expect(alert.getByText(label, { exact: true })).toHaveCSS('color', color.border);
        colors.push(color.border);
      }
      expect(new Set(colors).size).toBe(5);
      await page.setViewportSize({ width: 320, height: 640 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally {
      await context.close();
    }
  });
}

test('alert colors follow the manual theme toggle', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/alerts/');
  const note = page.getByRole('note', { name: 'Note', exact: true });
  const borderColor = () => note.evaluate(element => getComputedStyle(element).borderLeftColor);
  const light = await borderColor();
  const toggle = page.getByRole('button', { name: 'Dark mode' });
  await toggle.click();
  await expect.poll(borderColor).not.toBe(light);
  await toggle.click();
  await expect.poll(borderColor).toBe(light);
});

test('alert stylesheet loads only where the shortcode is used', async ({ page }) => {
  const loaded = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/css/alert.css') loaded.push(request.url());
  });
  await page.goto('/');
  expect(loaded).toHaveLength(0);
  await page.goto('/alerts/');
  expect(loaded).toHaveLength(1);
});
