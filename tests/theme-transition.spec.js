import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'light' });

const toggle = page => page.getByRole('banner').getByRole('button', { name: 'Dark mode', exact: true });

test('theme changes persist on reload', async ({ page }) => {
  await page.goto('/');
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
});

test('rapid toggles preserve the final choice', async ({ page }) => {
  await page.goto('/');
  await toggle(page).click();
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
});

test('theme switching works with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
});

test('browsers without view transitions still switch themes', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined });
  });
  await page.goto('/');
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
});
