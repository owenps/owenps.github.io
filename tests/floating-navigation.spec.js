import { test, expect } from '@playwright/test';

const quick = page => page.getByRole('navigation', { name: 'Quick navigation', exact: true });
const main = page => page.getByRole('navigation', { name: 'Main', exact: true });
const opener = page => quick(page).getByRole('button', { name: 'Open navigation', exact: true });
const closer = page => quick(page).getByRole('button', { name: 'Close navigation', exact: true });

async function scrollToReading(page) {
  await page.mouse.wheel(0, 600);
  await expect(opener(page)).toBeVisible();
  await expect.poll(() => quick(page).evaluate(el => el.getAnimations().length)).toBe(0);
}

async function openNavigation(page) {
  await scrollToReading(page);
  await opener(page).click();
  await expect(closer(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(quick(page).getByRole('link', { name: 'Home', exact: true })).toBeInViewport();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/blog/floating-navigation/');
});

test('appears only after the header leaves view and returns collapsed after scrolling back', async ({ page }) => {
  await expect(quick(page)).toBeHidden();
  const header = await main(page).boundingBox();
  await page.mouse.wheel(0, header.y + header.height / 2);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(header.y);
  await expect(quick(page)).toBeHidden();
  await scrollToReading(page);
  await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(quick(page).getByRole('link', { name: 'Home', exact: true })).toBeHidden();
  await opener(page).click();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(quick(page)).toBeHidden();
  await scrollToReading(page);
  await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
});

test('expands left without moving its anchor and preserves the current section', async ({ page }) => {
  await scrollToReading(page);
  const anchor = await opener(page).boundingBox();
  await opener(page).click();
  const expanded = await closer(page).boundingBox();
  expect(expanded.x).toBeCloseTo(anchor.x, 1);
  expect(expanded.y).toBeCloseTo(anchor.y, 1);
  await expect(quick(page).getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('aria-current', 'location');
  await expect(quick(page).getByRole('link', { name: 'Home', exact: true })).toBeInViewport();
  await expect(quick(page).getByRole('button', { name: 'Dark mode', exact: true })).toBeInViewport();
  await expect(quick(page).getByRole('button', { name: 'Back to top', exact: true })).toBeInViewport();
});

test('icon actions stay flat while the active page and header toggle stay raised', async ({ page }) => {
  await openNavigation(page);
  for (const name of ['Dark mode', 'Back to top', 'Close navigation']) {
    await expect(quick(page).getByRole('button', { name, exact: true })).toHaveCSS('box-shadow', 'none');
  }
  await expect(quick(page).getByRole('link', { name: 'Blog', exact: true })).not.toHaveCSS('box-shadow', 'none');
  await expect(page.locator('header').getByRole('button', { name: 'Dark mode', exact: true })).not.toHaveCSS('box-shadow', 'none');
  const theme = quick(page).getByRole('button', { name: 'Dark mode', exact: true });
  const restingColor = await theme.evaluate(el => getComputedStyle(el).color);
  await theme.hover();
  await expect(theme).not.toHaveCSS('color', restingColor);
  await page.mouse.move(0, 0);
  await expect(theme).toHaveCSS('color', restingColor);
});

test('the full-height icon hover areas are clickable', async ({ page }) => {
  await openNavigation(page);
  await expect(quick(page)).toHaveCSS('width', '288px');
  const pill = await quick(page).boundingBox();
  const theme = quick(page).getByRole('button', { name: 'Dark mode', exact: true });
  const themeBox = await theme.boundingBox();
  await page.mouse.click(themeBox.x + themeBox.width / 2, pill.y + 1);
  await expect(theme).toHaveAttribute('aria-pressed', 'true');
  const top = await quick(page).getByRole('button', { name: 'Back to top', exact: true }).boundingBox();
  await page.mouse.click(top.x + top.width / 2, pill.y + 1);
  await expect(main(page)).toBeInViewport();
  await expect(quick(page)).toBeHidden();
});

for (const location of ['header', 'floating']) {
  test(`${location} theme button stays anchored through press and release`, async ({ page }) => {
    if (location === 'floating') await openNavigation(page);
    const region = location === 'floating' ? quick(page) : page.getByRole('banner');
    const theme = region.getByRole('button', { name: 'Dark mode', exact: true });
    await theme.hover();
    const resting = await theme.boundingBox();
    const expectStationary = async () => {
      // Observe the gesture over multiple frames, not only its settled endpoints.
      const frames = await theme.evaluate(button => new Promise(resolve => {
        const samples = [];
        const start = performance.now();
        function sample(time) {
          const { x, y, width, height } = button.getBoundingClientRect();
          samples.push({ x, y, width, height });
          if (time - start < 300) requestAnimationFrame(sample);
          else resolve(samples);
        }
        requestAnimationFrame(sample);
      }));
      for (const frame of frames) expect(frame).toEqual(resting);
    };
    for (const pressed of ['true', 'false']) {
      await page.mouse.down();
      await expectStationary();
      await page.mouse.up();
      await expectStationary();
      await expect(theme).toHaveAttribute('aria-pressed', pressed);
    }
  });
}

test('keyboard disclosure, Escape, and outside click dismiss without losing focus', async ({ page, browserName }) => {
  await scrollToReading(page);
  await opener(page).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(quick(page).getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener(page)).toBeFocused();
  await expect(quick(page).getByRole('link', { name: 'Home', exact: true })).toBeHidden();
  await opener(page).click();
  await page.mouse.click(20, 200);
  await expect(opener(page)).toBeVisible();
  await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
});

test('returning to the header restores focus to the corresponding header control', async ({ page }) => {
  await openNavigation(page);
  await quick(page).getByRole('link', { name: 'Blog', exact: true }).focus();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(quick(page)).toBeHidden();
  await expect(main(page).getByRole('link', { name: 'Blog', exact: true })).toBeFocused();
});

test('theme changes stay synchronized and native navigation retains the preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await openNavigation(page);
  const theme = quick(page).getByRole('button', { name: 'Dark mode', exact: true });
  await expect(theme).toHaveAttribute('aria-pressed', 'false');
  await theme.click();
  await expect(theme).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('header').getByRole('button', { name: 'Dark mode', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(25, 25, 25)');
  await quick(page).getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.locator('header').getByRole('button', { name: 'Dark mode', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(quick(page)).toBeHidden();
  await page.goBack();
  await expect(opener(page)).toBeVisible();
  await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
});

test('fits narrow screens and does not cover footer controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await openNavigation(page);
  await quick(page).getByRole('button', { name: 'Back to top', exact: true }).click({ trial: true });
  await expect.poll(() => quick(page).evaluate(el => el.getAnimations().length)).toBe(0);
  const dock = await quick(page).boundingBox();
  expect(dock.x).toBeGreaterThanOrEqual(16);
  expect(dock.x + dock.width).toBeLessThanOrEqual(304);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await closer(page).click();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const footer = page.getByRole('link', { name: 'View source on GitHub', exact: true });
  await expect(footer).toBeInViewport();
  const footerBox = await footer.boundingBox();
  const dockBox = await quick(page).boundingBox();
  expect(footerBox.y + footerBox.height).toBeLessThan(dockBox.y);
});

test('entrance fades through intermediate opacity and settles fully visible', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Quick navigation', exact: true, includeHidden: true });
  const faded = await nav.evaluate(el => new Promise(resolve => {
    const started = performance.now();
    let intermediate = false;
    scrollTo(0, 600);
    function sample() {
      const opacity = Number(getComputedStyle(el).opacity);
      if (opacity > 0 && opacity < 1) intermediate = true;
      if (opacity === 1 || performance.now() - started > 2000) resolve(intermediate && opacity === 1);
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  expect(faded).toBe(true);
  await expect(opener(page)).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(quick(page)).toBeHidden();
  await scrollToReading(page);
  await expect(quick(page)).toHaveCSS('opacity', '1');
});

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`back-to-top arrow returns to the header with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await openNavigation(page);
    const top = quick(page).getByRole('button', { name: 'Back to top', exact: true });
    await top.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(quick(page)).toBeHidden();
    await expect(main(page).getByRole('link', { name: 'Blog', exact: true })).toBeFocused();
  });
}

test('reduced motion removes expansion and icon animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openNavigation(page);
  expect(await quick(page).evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  await closer(page).click();
  expect(await quick(page).evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
});

test('high-contrast mode keeps a solid, operable navigation control', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await openNavigation(page);
  await expect(quick(page)).toHaveCSS('border-top-style', 'solid');
  await expect(quick(page).getByRole('link', { name: 'Blog', exact: true })).toHaveCSS('border-top-width', '1px');
  await quick(page).getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
});

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

  test('tap expands, selects the theme, and collapses the navigation', async ({ page }) => {
    await page.evaluate(() => scrollTo(0, 600));
    await expect(opener(page)).toBeVisible();
    await opener(page).tap();
    const theme = quick(page).getByRole('button', { name: 'Dark mode', exact: true });
    const initial = await theme.getAttribute('aria-pressed');
    await theme.tap();
    await expect(theme).toHaveAttribute('aria-pressed', initial === 'true' ? 'false' : 'true');
    await closer(page).tap();
    await expect(opener(page)).toBeVisible();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('no dead floating control is exposed; original navigation works', async ({ page }) => {
    await page.mouse.wheel(0, 600);
    await expect(quick(page)).toBeHidden();
    await main(page).getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
