import { test, expect } from '@playwright/test';

const navigation = page => page.getByRole('navigation', { name: 'Main', exact: true });
const home = page => navigation(page).getByRole('link', { name: 'Home', exact: true });
const blog = page => navigation(page).getByRole('link', { name: 'Blog', exact: true });

for (const colorScheme of ['light', 'dark']) {
  test(`navigation follows the current page and section in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await expect(home(page)).toHaveAttribute('aria-current', 'page');
    await expect(blog(page)).not.toHaveAttribute('aria-current');

    await blog(page).click();
    await expect(page).toHaveURL(/\/blog\/$/);
    await expect(blog(page)).toHaveAttribute('aria-current', 'page');
    await expect(home(page)).not.toHaveAttribute('aria-current');

    await page.getByRole('link', { name: 'Navigation example', exact: true }).click();
    await expect(blog(page)).toHaveAttribute('aria-current', 'location');
    await expect(home(page)).not.toHaveAttribute('aria-current');

    await home(page).click();
    await expect(home(page)).toHaveAttribute('aria-current', 'page');
    await page.goBack();
    await expect(blog(page)).toHaveAttribute('aria-current', 'location');
  });
}

test('unlisted pages do not incorrectly select Home', async ({ page }) => {
  await page.goto('/unlisted/');
  await expect(home(page)).not.toHaveAttribute('aria-current');
  await expect(blog(page)).not.toHaveAttribute('aria-current');
});

test('keyboard navigation and the separate theme toggle remain usable', async ({ page, browserName }) => {
  await page.goto('/');
  await home(page).focus();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(blog(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(blog(page)).toHaveAttribute('aria-current', 'page');

  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  const initial = await toggle.getAttribute('aria-pressed');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', initial === 'true' ? 'false' : 'true');
  await expect(blog(page)).toHaveAttribute('aria-current', 'page');
});

test('navigation and toggle fit side by side at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  const navBox = await navigation(page).boundingBox();
  const toggleBox = await page.getByRole('button', { name: 'Dark mode', exact: true }).boundingBox();
  expect(navBox.x + navBox.width).toBeLessThan(toggleBox.x);
  expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('high-contrast navigation retains an identifiable current link', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/blog/');
  await expect(blog(page)).toHaveAttribute('aria-current', 'page');
  await expect(blog(page)).toHaveCSS('border-top-style', 'solid');
  await expect(blog(page)).toHaveCSS('border-top-width', '1px');
  await home(page).click();
  await expect(home(page)).toHaveAttribute('aria-current', 'page');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('native links and section indication still work', async ({ page }) => {
    await page.goto('/blog/navigation-example/');
    await expect(blog(page)).toHaveAttribute('aria-current', 'location');
    await home(page).click();
    await expect(home(page)).toHaveAttribute('aria-current', 'page');
    await blog(page).click();
    await expect(blog(page)).toHaveAttribute('aria-current', 'page');
  });
});
