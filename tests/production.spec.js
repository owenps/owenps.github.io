import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4176' });

async function expectPageAndAssets(page, request) {
  await expect(page.getByRole('main')).toBeVisible();
  const assets = await page.locator('link[rel="stylesheet"], link[rel="preload"], script[src], img[src]').evaluateAll(elements =>
    [...new Set(elements.map(element => element.href || element.src))]
      .filter(url => new URL(url).origin === location.origin),
  );
  for (const url of assets) {
    expect((await request.get(url)).ok(), `Asset failed to load: ${url}`).toBe(true);
  }
}

test('built site serves the homepage, blog, article, and assets with working navigation', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  expect((await page.goto('/')).ok()).toBe(true);
  await expectPageAndAssets(page, request);
  const theme = page.getByRole('banner').getByRole('button', { name: 'Dark mode', exact: true });
  const initial = await theme.getAttribute('aria-pressed');
  await theme.click();
  await expect(theme).toHaveAttribute('aria-pressed', initial === 'true' ? 'false' : 'true');

  const navigation = page.getByRole('navigation', { name: 'Main', exact: true });
  await navigation.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page).toHaveURL('/blog/');
  await expectPageAndAssets(page, request);

  const article = page.getByRole('main').getByRole('link').filter({ hasNotText: /^#/ }).first();
  const title = await article.textContent();
  await article.click();
  await expect(page.getByRole('heading', { name: title.trim(), exact: true })).toBeVisible();
  await expectPageAndAssets(page, request);

  await navigation.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL('/');
  expect(errors).toEqual([]);
});
