import { test, expect } from '@playwright/test';

const quick = page => page.getByRole('navigation', { name: 'Quick navigation', exact: true });
const main = page => page.getByRole('navigation', { name: 'Main', exact: true });
const opener = page => quick(page).getByRole('button', { name: 'Open navigation', exact: true });
const closer = page => quick(page).getByRole('button', { name: 'Close navigation', exact: true });

async function scrollToReading(page) {
  await page.mouse.wheel(0, 600);
  await expect(opener(page)).toBeVisible();
}

async function openNavigation(page) {
  await scrollToReading(page);
  await opener(page).click();
  await expect(closer(page)).toHaveAttribute('aria-expanded', 'true');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/blog/floating-navigation/');
});

test('scrolling reveals navigation; back to top restores the header and focus', async ({ page }) => {
  await expect(quick(page)).toBeHidden();
  await openNavigation(page);
  await expect(quick(page).getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('aria-current', 'location');

  const top = quick(page).getByRole('button', { name: 'Back to top', exact: true });
  await top.focus();
  await page.keyboard.press('Enter');
  await expect(main(page)).toBeInViewport();
  await expect(quick(page)).toBeHidden();
  await expect(main(page).getByRole('link', { name: 'Blog', exact: true })).toBeFocused();
});

test('keyboard opens navigation and Escape closes it with focus restored', async ({ page, browserName }) => {
  await scrollToReading(page);
  await opener(page).focus();
  await page.keyboard.press('Enter');
  await expect(closer(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(quick(page).getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener(page)).toBeFocused();
  await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(quick(page).getByRole('link', { name: 'Home', exact: true })).toBeHidden();
});

test('theme changes synchronize with the header and persist after navigation', async ({ page }) => {
  await openNavigation(page);
  const theme = quick(page).getByRole('button', { name: 'Dark mode', exact: true });
  const initial = await theme.getAttribute('aria-pressed');
  const changed = initial === 'true' ? 'false' : 'true';
  await theme.click();
  await expect(theme).toHaveAttribute('aria-pressed', changed);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Dark mode', exact: true })).toHaveAttribute('aria-pressed', changed);

  await quick(page).getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Dark mode', exact: true })).toHaveAttribute('aria-pressed', changed);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('no dead floating control is exposed; original navigation works', async ({ page }) => {
    await page.mouse.wheel(0, 600);
    await expect(quick(page)).toBeHidden();
    await main(page).getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page).toHaveURL('/');
  });
});
