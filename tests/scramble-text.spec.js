import { test, expect } from '@playwright/test';

const title = page => page.getByRole('main').getByRole('heading', { name: /^(owenps|owen smith)$/ });
const titleLink = page => page.getByRole('main').getByRole('link', { name: /^(owenps|owen smith)$/ });

test('hover reveals the name and leaving restores the handle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/scramble/');
  await expect(title(page)).toHaveText('owenps');
  await title(page).hover();
  await expect(title(page)).toHaveText('owen smith');
  await expect(title(page)).toHaveAccessibleName('owen smith');
  await page.mouse.move(0, 0);
  await expect(title(page)).toHaveText('owenps');
  await expect(title(page)).toHaveAccessibleName('owenps');
});

test('keyboard focus reveals the name, blur restores it, and the link works', async ({ page }) => {
  await page.goto('/scramble/');
  await titleLink(page).focus();
  await expect(title(page)).toHaveText('owen smith');
  await expect(titleLink(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(title(page)).toHaveText('owenps');

  await titleLink(page).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
});

test('reduced motion keeps the title usable without animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // A paused clock checks that revealing/resetting needs no animation frames.
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto('/scramble/');
  await expect(title(page)).toHaveText('owenps');
  await title(page).hover();
  await expect(title(page)).toHaveText('owen smith');
  await page.mouse.move(0, 0);
  await expect(title(page)).toHaveText('owenps');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('title remains readable and links home', async ({ page }) => {
    await page.goto('/scramble/');
    await expect(title(page)).toHaveText('owenps');
    await titleLink(page).click();
    await expect(page).toHaveURL('/');
  });
});
