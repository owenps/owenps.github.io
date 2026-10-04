import { test, expect } from '@playwright/test';

const trigger = page => page.getByRole('link', { name: /Blue Sheep/ });
const preview = page => page.getByRole('dialog', { name: 'Blue Sheep preview', exact: true, includeHidden: true });
const video = page => preview(page).getByLabel('Blue Sheep Films website preview');

test('video loads on hover, plays muted, pauses on dismissal, and resumes on reopening', async ({ page }) => {
  const requests = [];
  page.on('request', request => {
    if (request.url().endsWith('.mp4')) requests.push(request.url());
  });
  await page.goto('/video-preview/');
  expect(requests).toHaveLength(0);
  await expect(trigger(page)).toHaveAttribute('href', 'https://bluesheep.pages.dev/');
  await trigger(page).hover();
  await expect(preview(page)).toBeVisible();
  const link = preview(page).getByRole('link', { name: /bluesheep.pages.dev/ });
  await expect(link).toHaveAttribute('href', 'https://bluesheep.pages.dev/');
  await expect.poll(() => video(page).evaluate(v => !v.paused && v.currentTime > 0)).toBe(true);
  expect(await video(page).evaluate(v => v.muted && v.loop && v.playsInline)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(preview(page)).not.toBeVisible();
  expect(await video(page).evaluate(v => v.paused)).toBe(true);
  await trigger(page).focus();
  await expect(preview(page)).toBeVisible();
  await expect.poll(() => video(page).evaluate(v => !v.paused)).toBe(true);
});

test('reduced motion shows a poster without autoplay and pauses an active video', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/video-preview/');
  await trigger(page).hover();
  await expect(video(page)).toBeVisible();
  expect(await video(page).evaluate(v => v.paused && !!v.poster)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => video(page).evaluate(v => !v.paused && v.currentTime > 0)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => video(page).evaluate(v => v.paused)).toBe(true);
});
