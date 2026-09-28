import { test, expect } from '@playwright/test';

const title = page => page.getByRole('heading', { name: /^(owenps|owen smith)$/ })
  .filter({ has: page.locator('scramble-text') });

async function freezeAnimation(page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
}

test('title reveals on hover and resets on leave without changing dimensions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 320, height: 700 });
  await freezeAnimation(page);
  await page.goto('/scramble/');
  const heading = title(page);
  const text = heading.locator('scramble-text');
  await expect(heading).toHaveText('owenps');
  await page.clock.runFor(1000);
  await expect(heading).toHaveText('owenps');
  const initial = await text.boundingBox();
  await text.hover();
  await expect(heading).not.toHaveText('owen smith');
  // The visual text keeps the shared prefix, even before any letters settle.
  const visual = text.locator('[aria-hidden="true"]');
  await expect(visual).toHaveText(/^owen /);
  await page.clock.runFor(100);
  await expect(visual).toHaveText(/^owen /);
  await page.clock.runFor(200);
  await expect(heading).toHaveAccessibleName('owen smith');
  await page.clock.runFor(700);
  await expect(heading).toHaveText('owen smith');
  expect(await text.boundingBox()).toEqual(initial);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.mouse.move(0, 0);
  await expect(heading).toHaveText('owen smith');
  await page.clock.runFor(80);
  await expect(heading).toHaveText('owen smith');
  await page.clock.runFor(60);
  await expect(heading).toHaveAccessibleName('owenps');
  await expect(heading).not.toHaveText('owenps');
  await expect(visual).toHaveText(/^owen/);
  await page.clock.runFor(200);
  await expect(heading).toHaveText('owenps');
  expect(await text.boundingBox()).toEqual(initial);
  // Leaving mid-animation must cancel the pending reveal too.
  await text.hover();
  await page.clock.runFor(100);
  await page.mouse.move(0, 0);
  await page.clock.runFor(1000);
  await expect(heading).toHaveText('owenps');
});

test('keyboard focus reveals the name and blur restores the handle', async ({ page }) => {
  await freezeAnimation(page);
  await page.goto('/scramble/');
  const link = page.getByRole('link', { name: /^(owenps|owen smith)$/ })
    .filter({ has: page.locator('scramble-text') });
  await link.focus();
  await page.clock.runFor(1000);
  await expect(title(page)).toHaveText('owen smith');
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute('href', '/');
  await link.hover();
  await page.mouse.move(0, 0);
  await expect(title(page)).toHaveText('owen smith');
  await page.keyboard.press('Tab');
  await page.clock.runFor(350);
  await expect(title(page)).toHaveText('owenps');
});

test('re-entering during the leave delay preserves the revealed name', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await freezeAnimation(page);
  await page.goto('/scramble/');
  await title(page).hover();
  await page.clock.runFor(1000);
  await page.mouse.move(0, 0);
  await page.clock.runFor(50);
  await title(page).hover();
  await expect(title(page)).toHaveText('owen smith');
  await page.clock.runFor(400);
  await expect(title(page)).toHaveText('owen smith');
});

test('re-entering during the reverse scramble reveals the name again', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await freezeAnimation(page);
  await page.goto('/scramble/');
  await title(page).hover();
  await page.clock.runFor(1000);
  await page.mouse.move(0, 0);
  await page.clock.runFor(150);
  await expect(title(page)).toHaveAccessibleName('owenps');
  await title(page).hover();
  await expect(title(page)).toHaveAccessibleName('owen smith');
  await expect(title(page).locator('[aria-hidden="true"]')).toHaveText(/^owen /);
  await page.clock.runFor(1000);
  await expect(title(page)).toHaveText('owen smith');
});

test('shortcode instances reveal independently and can replay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await freezeAnimation(page);
  await page.goto('/scramble/');
  const work = page.getByRole('heading', { name: 'Work & Play', exact: true });
  const spaced = page.getByRole('heading', { name: 'A B!', exact: true });
  await expect(work).toBeVisible();
  await expect(spaced).toBeVisible();
  await page.clock.runFor(1000);
  await expect(work).toHaveText('Work & Play');
  expect(await spaced.locator('scramble-text').textContent()).toBe('A  B!');
  await work.locator('scramble-text').evaluate(node => node.scramble());
  await expect(work).not.toHaveText('Work & Play');
  await expect(title(page)).toHaveText('owenps');
  await page.clock.runFor(1000);
  await expect(work).toHaveText('Work & Play');
});

test('reduced motion switches labels immediately on hover and leave', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freezeAnimation(page);
  await page.goto('/scramble/');
  await expect(title(page)).toHaveText('owenps');
  await title(page).hover();
  await expect(title(page)).toHaveText('owen smith');
  await page.mouse.move(0, 0);
  await expect(title(page)).toHaveText('owenps');
});

test('enabling reduced motion stops an active reveal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await freezeAnimation(page);
  await page.goto('/scramble/');
  await title(page).hover();
  await expect(title(page)).not.toHaveText('owen smith');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(title(page)).toHaveText('owen smith');
});

test('enabling reduced motion during the leave delay restores the handle immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await freezeAnimation(page);
  await page.goto('/scramble/');
  await title(page).hover();
  await page.clock.runFor(1000);
  await page.mouse.move(0, 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(title(page)).toHaveText('owenps');
  await page.clock.runFor(400);
  await expect(title(page)).toHaveText('owenps');
});

test('site header stays plain on hover and focus', async ({ page }) => {
  await freezeAnimation(page);
  await page.goto('/');
  const heading = page.getByRole('heading', { name: 'owenps', exact: true });
  const link = page.getByRole('link', { name: 'owenps', exact: true });
  await link.hover();
  await link.focus();
  await page.clock.runFor(1000);
  await expect(heading).toHaveText('owenps');
  await expect(link).toHaveAccessibleName('owenps');
  await expect(link).toHaveAttribute('href', '/');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('title remains readable and links home', async ({ page }) => {
    await page.goto('/scramble/');
    await expect(title(page)).toHaveText('owenps');
    await page.getByRole('link', { name: 'owenps', exact: true })
      .filter({ has: page.locator('scramble-text') }).click();
    await expect(page).toHaveURL('/');
  });
});
