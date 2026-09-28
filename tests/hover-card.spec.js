import { test, expect } from '@playwright/test';

const photoTrigger = page => page.getByRole('button', { name: 'Owen', exact: true });
const photoCard = page => page.getByRole('dialog', { name: 'Owen preview', exact: true });

async function insideViewport(page, card) {
  await expect.poll(async () => {
    const box = await card.boundingBox();
    const viewport = page.viewportSize();
    return box && box.x >= 0 && box.y >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y + box.height <= viewport.height;
  }).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function tab(page, browserName, backwards = false) {
  const modifiers = `${browserName === 'webkit' ? 'Alt+' : ''}${backwards ? 'Shift+' : ''}`;
  await page.keyboard.press(`${modifiers}Tab`);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('photo opens on hover, stays open over the card, and dismisses on leaving', async ({ page }) => {
  const trigger = photoTrigger(page);
  const card = photoCard(page);
  await trigger.hover();
  await expect(card).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const image = card.getByRole('img', { name: 'Owen Smith' });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await insideViewport(page, card);
  await card.hover();
  await page.waitForTimeout(400);
  await expect(card).toBeVisible();
  await page.getByRole('link', { name: 'Before examples' }).hover();
  await expect(card).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('keyboard can inspect a photo and Escape restores focus without reopening', async ({ page, browserName }) => {
  await page.getByRole('link', { name: 'Before examples' }).focus();
  await tab(page, browserName);
  await expect(photoTrigger(page)).toBeFocused();
  await expect(photoCard(page)).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(photoCard(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(photoTrigger(page)).toBeFocused();
  await expect(photoCard(page)).toBeHidden();
});

test('text cards preserve Markdown and only one preview is open', async ({ page }) => {
  await photoTrigger(page).hover();
  await page.getByRole('button', { name: 'Edge preview', exact: true }).hover();
  await expect(photoCard(page)).toBeHidden();
  await page.getByRole('button', { name: 'an explanation', exact: true }).hover();
  const card = page.getByRole('dialog', { name: 'an explanation preview' });
  await expect(card).toBeVisible();
  await expect(card.locator('strong')).toHaveText('bold text');
  await expect(card.locator('em')).toHaveText('emphasis');
  await expect(photoCard(page)).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
});

test('link previews retain navigation and logical keyboard order through card links', async ({ page, browserName }) => {
  const trigger = page.getByRole('link', { name: 'this project', exact: true });
  const card = page.getByRole('dialog', { name: 'this project preview' });
  await trigger.focus();
  await expect(card).toBeVisible();
  await tab(page, browserName);
  await expect(card.getByRole('link', { name: 'Read details' })).toBeFocused();
  await tab(page, browserName, true);
  await expect(trigger).toBeFocused();
  await tab(page, browserName);
  await tab(page, browserName);
  await expect(card.getByRole('link', { name: 'other details' })).toBeFocused();
  await tab(page, browserName);
  await expect(page.getByRole('link', { name: 'After project' })).toBeFocused();
  await expect(card).toBeHidden();
  await trigger.click();
  await expect(page).toHaveURL(/#destination$/);
});

test('cursor follow moves the card and settles without changing the trigger layout', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'a longer trigger to follow across the page' });
  const card = page.getByRole('dialog', { name: 'a longer trigger to follow across the page preview' });
  const triggerBox = await trigger.boundingBox();
  await trigger.hover({ position: { x: 8, y: triggerBox.height / 2 } });
  await expect(card).toBeVisible();
  await page.waitForTimeout(250);
  const initial = await card.boundingBox();
  await page.mouse.move(triggerBox.x + triggerBox.width - 8, triggerBox.y + triggerBox.height / 2);
  await expect.poll(async () => (await card.boundingBox()).x).toBeGreaterThan(initial.x + 80);
  await insideViewport(page, card);
  expect(await trigger.boundingBox()).toEqual(triggerBox);
});

test('flips at viewport edges and handles scaled ancestors and narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  const trigger = page.getByRole('button', { name: 'Edge preview', exact: true });
  const card = page.getByRole('dialog', { name: 'Edge preview preview' });
  await trigger.hover();
  await expect(card).toBeVisible();
  await expect.poll(async () => (await card.boundingBox()).y).toBeGreaterThan((await trigger.boundingBox()).y);
  await insideViewport(page, card);
  await page.keyboard.press('Escape');
  await page.locator('#edge-host').evaluate(host => { host.style.top = 'auto'; host.style.bottom = '8px'; });
  await page.mouse.move(0, 0);
  await trigger.hover();
  await expect(card).toBeVisible();
  await insideViewport(page, card);
  expect((await card.boundingBox()).y).toBeLessThan((await trigger.boundingBox()).y);
});

test('long content scrolls inside the card and its links remain reachable', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 375, height: 500 });
  const trigger = page.getByRole('button', { name: 'Long card', exact: true });
  const card = page.getByRole('dialog', { name: 'Long card preview' });
  await trigger.focus();
  await expect(card).toBeVisible();
  await insideViewport(page, card);
  await page.keyboard.press('ArrowDown');
  await tab(page, browserName);
  await expect(card.getByRole('link', { name: 'Last detail' })).toBeFocused();
  await expect(card.getByRole('link', { name: 'Last detail' })).toBeInViewport();
  await insideViewport(page, card);
});

test('reduced motion stays anchored without animated transformations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const trigger = page.getByRole('button', { name: 'a longer trigger to follow across the page' });
  const card = page.getByRole('dialog', { name: 'a longer trigger to follow across the page preview' });
  const box = await trigger.boundingBox();
  await trigger.hover({ position: { x: 8, y: box.height / 2 } });
  await expect(card).toBeVisible();
  const initial = await card.boundingBox();
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
  await page.waitForTimeout(250);
  expect(await card.boundingBox()).toEqual(initial);
  expect(await card.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(card).toHaveCSS('filter', 'none');
});

test('existing annotation tooltips still work independently', async ({ page }) => {
  await page.getByText('highlighted note', { exact: true }).hover();
  await expect(page.getByRole('tooltip')).toHaveText('Original annotation note.');
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
});

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

  test('tap pins a readable photo until toggled or dismissed outside', async ({ page }) => {
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeVisible();
    await page.waitForTimeout(1600);
    await expect(photoCard(page)).toBeVisible();
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeHidden();
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeVisible();
    await page.touchscreen.tap(350, 700);
    await expect(photoCard(page)).toBeHidden();
  });

  test('link first tap previews and second tap navigates', async ({ page }) => {
    const trigger = page.getByRole('link', { name: 'this project', exact: true });
    await trigger.tap();
    await expect(page.getByRole('dialog', { name: 'this project preview' })).toBeVisible();
    await expect(page).not.toHaveURL(/#destination$/);
    await trigger.tap();
    await expect(page).toHaveURL(/#destination$/);
  });

  test('public initialization can be repeated without double toggles', async ({ page }) => {
    await page.evaluate(async () => {
      const { initHoverCards } = await import('/js/hover-card.js');
      initHoverCards();
      initHoverCards();
    });
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeVisible();
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeHidden();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('name stays readable and real links still navigate', async ({ page }) => {
    await expect(photoTrigger(page)).toBeVisible();
    await expect(photoTrigger(page)).toBeDisabled();
    await page.getByRole('link', { name: 'this project', exact: true }).click();
    await expect(page).toHaveURL(/#destination$/);
  });
});
