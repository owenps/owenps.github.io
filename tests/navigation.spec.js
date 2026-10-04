import { test, expect } from '@playwright/test';

const navigation = page => page.getByRole('navigation', { name: 'Main', exact: true });
const home = page => navigation(page).getByRole('link', { name: 'Home', exact: true });
const blog = page => navigation(page).getByRole('link', { name: 'Blog', exact: true });

test('navigation follows the current page and section', async ({ page }) => {
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
  await expect(page).toHaveURL('/');
  await expect(home(page)).toHaveAttribute('aria-current', 'page');
});

test('navigation and theme toggle work with the keyboard', async ({ page, browserName }) => {
  await page.goto('/');
  await home(page).focus();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(blog(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(blog(page)).toHaveAttribute('aria-current', 'page');

  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  const initial = await toggle.getAttribute('aria-pressed');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', initial === 'true' ? 'false' : 'true');
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
