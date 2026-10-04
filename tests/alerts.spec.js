import { test, expect } from '@playwright/test';

const labels = ['Note', 'Tip', 'Important', 'Warning', 'Caution'];

test.use({ javaScriptEnabled: false });

test('alerts retain labels, Markdown, and working links without JavaScript', async ({ page }) => {
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
