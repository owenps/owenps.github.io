import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4176' });

async function expectLoaded(image) {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
}

test('homepage shows the profile images while preserving bio and navigation', async ({ page }) => {
  await page.goto('/');
  const profile = page.getByRole('region', { name: 'Profile header', exact: true });
  await expectLoaded(profile.getByRole('img', { name: 'Owen Smith', exact: true }));
  await expectLoaded(profile.locator('img[alt=""]'));
  await expect(profile.getByRole('heading')).toHaveCount(0);
  await expect(profile.getByText('@owenps', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Based in Toronto, Canada.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent Projects', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page).toHaveURL('/blog/');
  await expect(page.getByRole('region', { name: 'Profile header', exact: true })).toHaveCount(0);
});

test('social previews and browser icons serve the portrait', async ({ page, request }) => {
  await page.goto('/');
  const portrait = new URL('/images/owenps.png', page.url()).href;
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', portrait);
  }
  const icon = await page.locator('link[rel="icon"]').getAttribute('href');
  const favicon = await request.get(icon);
  expect(favicon.ok()).toBe(true);
  expect(favicon.headers()['content-type']).toContain('image/png');
  const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await request.get(touchIcon)).ok()).toBe(true);
  const manifestURL = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await request.get(manifestURL)).json();
  for (const image of manifest.icons) expect((await request.get(image.src)).ok()).toBe(true);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const colorScheme of ['light', 'dark']) {
    test(`profile stays readable and contained on narrow screens in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto('/');
      const profile = page.getByRole('region', { name: 'Profile header', exact: true });
      const banner = profile.locator('img[alt=""]');
      const avatar = profile.getByRole('img', { name: 'Owen Smith', exact: true });
      await expectLoaded(banner);
      await expectLoaded(avatar);
      const bannerBounds = await banner.boundingBox();
      const avatarBounds = await avatar.boundingBox();
      expect(avatarBounds.y).toBeLessThan(bannerBounds.y + bannerBounds.height);
      expect(avatarBounds.y + avatarBounds.height).toBeGreaterThan(bannerBounds.y + bannerBounds.height);
      await expect(profile.getByRole('heading')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
});
