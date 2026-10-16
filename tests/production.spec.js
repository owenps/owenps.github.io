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

for (const mobile of [false, true]) {
  test(`homepage groups website previews and lists recent projects (${mobile ? 'touch' : 'desktop'})`, async ({ browser, request }) => {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:4176',
      viewport: mobile ? { width: 375, height: 812 } : { width: 1280, height: 800 },
      hasTouch: mobile,
      isMobile: mobile,
    });
    try {
      const page = await context.newPage();
      await page.goto('/');
      let previousBounds;
      for (const [name, url] of [
        ['johncardillojr.com', 'http://johncardillojr.com/'],
        ['hughmurray.life', 'https://hughmurray.life/'],
        ['bluesheepfilms.com', 'https://bluesheepfilms.com/'],
      ]) {
        const project = page.getByRole('link', { name: new RegExp(`^${name.replaceAll('.', '\\.')}`) });
        await expect(project).toBeVisible();
        await expect(project).toHaveAttribute('href', url);
        const bounds = await project.boundingBox();
        if (previousBounds) expect(bounds.y).toBeGreaterThanOrEqual(previousBounds.y + previousBounds.height);
        previousBounds = bounds;
      }

      const trigger = page.getByRole('button', { name: 'designing and building websites', exact: true });
      if (mobile) await trigger.tap();
      else await trigger.hover();
      const preview = page.getByRole('dialog', { name: 'designing and building websites preview', exact: true, includeHidden: true });
      await expect(preview).toBeVisible();
      for (const [label, url, name] of [
        ['Blue Sheep Films website preview', 'https://bluesheepfilms.com/', 'bluesheepfilms.com'],
        ['Hugh Murray website preview', 'https://hughmurray.life/', 'hughmurray.life'],
        ['John Cardillo Jr. website preview', 'http://johncardillojr.com/', 'johncardillojr.com'],
      ]) {
        const video = preview.getByLabel(label);
        await expect(video).toBeVisible();
        await expect.poll(() => video.evaluate(v => !v.paused && v.currentTime > 0)).toBe(true);
        expect(await video.evaluate(v => v.muted && v.loop && v.playsInline)).toBe(true);
        expect((await request.get(await video.getAttribute('poster'))).ok()).toBe(true);
        const link = preview.getByRole('link', { name: new RegExp(`^${name.replaceAll('.', '\\.')}`) });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', url);
        const bounds = await link.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(mobile ? 375 : 1280);
      }
      if (mobile) await trigger.tap();
      else await page.keyboard.press('Escape');
      await expect(preview).not.toBeVisible();
      for (const video of await preview.locator('video').all()) {
        expect(await video.evaluate(v => v.paused)).toBe(true);
      }
    } finally {
      await context.close();
    }
  });
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
