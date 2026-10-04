import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'light' });

const toggle = page => page.getByRole('banner').getByRole('button', { name: 'Dark mode', exact: true });
const siteAnimations = page => page.evaluate(() => document.getAnimations()
  .filter(animation => animation.effect?.target === document.documentElement)
  .map(animation => ({
    ...animation.effect.getTiming(),
    keyframes: animation.effect.getKeyframes(),
  })));

test('theme change crossfades the site with ease-in-out and persists on reload', async ({ page }) => {
  await page.goto('/');
  expect(await siteAnimations(page)).toEqual([]);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await siteAnimations(page))
    .some(timing => timing.duration === 350 && timing.keyframes
      .some(frame => frame.opacity === '0' && frame.easing === 'ease-in-out'))).toBe(true);
  await expect.poll(async () => (await siteAnimations(page)).length).toBe(0);
  await page.reload();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  expect(await siteAnimations(page)).toEqual([]);
});

test('rapid toggles preserve the final choice', async ({ page }) => {
  await page.goto('/');
  await toggle(page).click();
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
});

test('reduced motion switches the theme without a site animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  expect(await siteAnimations(page)).toEqual([]);
});

test('browsers without view transitions still switch themes', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined });
  });
  await page.goto('/');
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  expect(await siteAnimations(page)).toEqual([]);
});
