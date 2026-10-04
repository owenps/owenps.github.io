import { test, expect } from '@playwright/test';

const photoTrigger = page => page.getByRole('button', { name: 'Owen', exact: true });
const photoCard = page => page.getByRole('dialog', { name: 'Owen preview', exact: true });

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
  await card.hover();
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

test('long content scrolls inside the card and its links remain reachable', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 375, height: 500 });
  const trigger = page.getByRole('button', { name: 'Long card', exact: true });
  const card = page.getByRole('dialog', { name: 'Long card preview' });
  await trigger.focus();
  await expect(card).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await tab(page, browserName);
  await expect(card.getByRole('link', { name: 'Last detail' })).toBeFocused();
  await expect(card.getByRole('link', { name: 'Last detail' })).toBeInViewport();
});

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

  test('tap pins a readable photo until toggled or dismissed outside', async ({ page }) => {
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeVisible();
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeHidden();
    await photoTrigger(page).tap();
    await expect(photoCard(page)).toBeVisible();
    await page.getByRole('link', { name: 'Before examples' }).tap();
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
