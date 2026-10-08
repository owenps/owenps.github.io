import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4176', javaScriptEnabled: false });

const socials = [
  ['GitHub', '@owenps', 'https://github.com/owenps/'],
  ['X', '@owenps_', 'https://x.com/owenps_/'],
  ['LinkedIn', null, 'https://www.linkedin.com/in/owenpsmith/'],
  ['Letterboxd', '@owenps', 'https://letterboxd.com/owenps/'],
  ['Chess.com', '0smith', 'https://www.chess.com/member/0smith/stats'],
  ['Instagram', '@owen.ps', 'https://www.instagram.com/owen.ps/'],
  ['YouTube', '@ow3nsmith', 'https://www.youtube.com/@ow3nsmith'],
];

for (const colorScheme of ['light', 'dark']) {
  test(`social icons reveal handles on hover and keyboard focus in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Socials', exact: true });
    await expect(navigation.getByRole('link')).toHaveCount(socials.length);
    await expect(page.locator('a[href="https://ledge.io/owen"]')).toHaveCount(0);

    for (const [name, tooltipText, url] of socials) {
      const link = navigation.getByRole('link', { name, exact: true });
      const tooltip = link.getByRole('tooltip', { includeHidden: true });
      await expect(link).toHaveAttribute('href', url);
      await expect.poll(() => link.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      if (tooltipText === null) {
        await expect(tooltip).toHaveCount(0);
        await expect(link).not.toHaveAttribute('aria-describedby');
        continue;
      }
      await expect(tooltip).toHaveText(tooltipText);
      await expect(tooltip).toBeHidden();
      await link.hover();
      await expect(tooltip).toBeVisible();
      const bounds = await tooltip.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
      await page.mouse.move(0, 0);
      await expect(tooltip).toBeHidden();

      await link.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(link).toBeFocused();
      await expect(tooltip).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(tooltip).toBeHidden();
      await page.getByRole('heading', { name: 'Socials', exact: true }).click();
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Other external links retain their existing text.
    await expect(page.getByRole('main').getByRole('link', { name: /Ledge/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /bluesheepfilms\.com/ })).toBeVisible();
  });
}
