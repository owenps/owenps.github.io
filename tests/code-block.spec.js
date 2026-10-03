import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const files = page => page.getByRole('group', { name: 'Code files', exact: true }).first();
const buttonCode = '// A comment with 42 stays a comment.\nexport function Button() {\n  return <button title="Save">Save</button>;\n}';

async function mockClipboard(page, fail = false) {
  await page.addInitScript(fail => {
    window.copiedValues = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async value => {
          if (fail) throw new Error('Permission denied');
          window.copiedValues.push(value);
        },
      },
    });
  }, fail);
}

test('ordinary, plain, and unknown-language fences remain readable and copy exact source', async ({ page }) => {
  await mockClipboard(page);
  await page.goto('/code-blocks/');
  const example = page.getByRole('group', { name: 'Code: button.tsx', exact: true });
  await expect(example.getByRole('region', { name: 'button.tsx', exact: true })).toContainText('export function Button()');
  const copy = example.getByRole('button', { name: 'Copy code' });
  const before = await copy.boundingBox();
  await copy.click();
  await expect(example.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => window.copiedValues)).toEqual([buttonCode]);
  expect((await copy.boundingBox()).width).toBe(before.width);
  await expect(example.getByRole('status')).toBeEmpty();

  await page.getByRole('group', { name: 'Code: text', exact: true }).getByRole('button', { name: 'Copy code' }).click();
  await page.getByRole('group', { name: 'Code: not-a-language', exact: true }).getByRole('button', { name: 'Copy code' }).click();
  expect(await page.evaluate(() => window.copiedValues.slice(1))).toEqual(['plain <text> & "quotes"\n\n  indented', 'still readable']);
  await expect(page.getByText('Inline code stays inline.')).toBeVisible();
});

test('file tabs support arrows, wrapping, Home/End, and independent instances', async ({ page }) => {
  await page.goto('/code-blocks/');
  const example = files(page);
  const button = example.getByRole('tab', { name: 'button.tsx', exact: true });
  const css = example.getByRole('tab', { name: 'styles.css', exact: true });
  await button.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(css).toBeFocused();
  await expect(css).toHaveAttribute('aria-selected', 'true');
  await expect(example.getByRole('tabpanel')).toHaveAccessibleName('styles.css');
  await page.keyboard.press('ArrowRight');
  await expect(button).toBeFocused();
  await page.keyboard.press('End');
  await expect(css).toBeFocused();
  await page.keyboard.press('Home');
  await expect(button).toBeFocused();
  await css.click();
  await expect(example.getByRole('tabpanel')).toHaveAccessibleName('styles.css');
  const other = page.getByRole('group', { name: 'Code files', exact: true }).last();
  await expect(other.getByRole('tab', { name: 'other.tsx' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  await expect(example.getByRole('button', { name: 'Copy code' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(example.getByRole('tabpanel')).toBeFocused();
});

test('switching files preserves scroll positions and copies only active code, not numbers', async ({ page }) => {
  await mockClipboard(page);
  await page.goto('/code-blocks/');
  const example = files(page);
  const button = example.getByRole('tabpanel', { name: 'button.tsx', exact: true });
  const number = button.getByText('1', { exact: true });
  const gutter = await number.boundingBox();
  await button.evaluate(panel => { panel.scrollLeft = 80; });
  expect(await button.evaluate(panel => panel.scrollLeft)).toBe(80);
  expect((await number.boundingBox()).x).toBe(gutter.x);
  await example.getByRole('tab', { name: 'styles.css' }).click();
  const css = example.getByRole('tabpanel', { name: 'styles.css', exact: true });
  await css.evaluate(panel => { panel.scrollTop = 70; });
  await example.getByRole('button', { name: 'Copy code' }).click();
  const copied = await page.evaluate(() => window.copiedValues.at(-1));
  expect(copied).toMatch(/^\/\* Strong ease-out/);
  expect(copied).toContain('height: 40px;');
  expect(copied).toMatch(/\n}$/);
  await example.getByRole('tab', { name: 'button.tsx', exact: true }).click();
  expect(await button.evaluate(panel => panel.scrollLeft)).toBe(80);
  await expect(example.getByRole('status')).toBeEmpty();
  await example.getByRole('button', { name: 'Copy code' }).click();
  expect(await page.evaluate(() => window.copiedValues.at(-1))).toContain('\n\n  const message = "<script>window.codeExecuted = true</script> & </template>";');
  expect(await page.evaluate(() => window.codeExecuted)).toBeUndefined();
  await example.getByRole('tab', { name: 'styles.css' }).click();
  expect(await css.evaluate(panel => panel.scrollTop)).toBe(70);
});

test('line numbers are author-configurable independently of headers and copying', async ({ page }) => {
  await mockClipboard(page);
  await page.goto('/code-block-options/');
  const fence = page.getByRole('group', { name: 'Code: plain.go', exact: true });
  await expect(fence.getByText('1', { exact: true })).toHaveCount(0);
  await expect(fence.getByRole('region')).toContainText('func main()');
  await fence.getByRole('button', { name: 'Copy code' }).click();
  expect(await page.evaluate(() => window.copiedValues)).toEqual(['func main() {\n  run()\n}']);
  const plain = page.getByRole('group', { name: 'Code: plain.txt', exact: true });
  await expect(plain.getByRole('button')).toHaveCount(0);
  await expect(plain.getByText('1', { exact: true })).toHaveCount(0);
  await expect(plain.getByRole('region')).toContainText('plain <text> & "quotes"');
  await expect(page.getByRole('group', { name: 'Code: numbered.css', exact: true }).getByText('1', { exact: true })).toBeVisible();
  const example = files(page);
  await expect(example.getByRole('tabpanel').getByText('1', { exact: true })).toHaveCount(0);
  await example.getByRole('tab', { name: 'numbered.css', exact: true }).click();
  await expect(example.getByRole('tabpanel').getByText('1', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Line numbers', exact: true })).toHaveCount(0);
});

test('unnumbered code has breathing room with and without a header', async ({ page }) => {
  await page.goto('/code-block-options/');
  for (const [name, text] of [['plain.go', 'func'], ['plain.txt', 'plain <text> & "quotes"']]) {
    const panel = page.getByRole('region', { name, exact: true });
    const bounds = await panel.boundingBox();
    const content = await panel.getByText(text, { exact: true }).boundingBox();
    expect(content.x - bounds.x).toBe(20);
    expect(content.y - bounds.y).toBeGreaterThanOrEqual(16);
  }
});

test('headers show by default and can be disabled without hiding code', async ({ page }) => {
  await page.goto('/code-blocks/');
  await expect(page.getByRole('group', { name: 'Code: js', exact: true }).getByText('js', { exact: true })).toBeVisible();
  const labeled = page.getByRole('group', { name: 'Code: css', exact: true });
  await expect(labeled.getByText('css', { exact: true })).toBeVisible();
  await expect(labeled.getByRole('button', { name: 'Copy code' })).toBeVisible();
  const headerless = page.getByRole('group', { name: 'Code: hidden.py', exact: true });
  await expect(headerless.getByText('hidden.py', { exact: true })).toHaveCount(0);
  await expect(headerless.getByRole('button')).toHaveCount(0);
  await expect(headerless.getByRole('region')).toContainText('print("hidden")');
  await expect(headerless.getByText('1', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Code: button.tsx', exact: true }).getByText('button.tsx', { exact: true })).toBeVisible();
});

test('headerless file groups expose every file with no dead controls', async ({ page }) => {
  await page.goto('/headerless-code/');
  const example = files(page);
  await expect(example.getByRole('region', { name: 'one.js' })).toContainText('const one = 1;');
  await expect(example.getByRole('region', { name: 'two.css' })).toContainText('.two { color: red; }');
  await expect(example.getByRole('region', { name: 'one.js' })).toBeVisible();
  await expect(example.getByRole('region', { name: 'two.css' })).toBeVisible();
  await expect(example.getByRole('button')).toHaveCount(0);
  await expect(example.getByRole('tab')).toHaveCount(0);
});

test('clipboard failures are announced without claiming success', async ({ page }) => {
  await mockClipboard(page, true);
  await page.goto('/code-blocks/');
  const example = files(page);
  await example.getByRole('button', { name: 'Copy code' }).click();
  await expect(example.getByRole('status')).toHaveText("Couldn't copy");
  await expect(example.getByText('Failed', { exact: true })).toBeVisible();
  await expect(example.getByText('Copied', { exact: true })).not.toBeVisible();
});

test('pending copy results cannot overwrite feedback after changing files', async ({ page }) => {
  await page.addInitScript(() => {
    window.copyRequests = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => new Promise((resolve, reject) => window.copyRequests.push({ resolve, reject })) },
    });
  });
  await page.goto('/code-blocks/');
  const example = files(page);
  await example.getByRole('button', { name: 'Copy code' }).click();
  await example.getByRole('tab', { name: 'styles.css' }).click();
  await example.getByRole('button', { name: 'Copy code' }).click();
  await page.evaluate(() => window.copyRequests[1].resolve());
  await expect(example.getByRole('status')).toHaveText('Copied');
  await page.evaluate(() => window.copyRequests[0].reject(new Error('Stale failure')));
  await expect(example.getByRole('status')).toHaveText('Copied');
});

for (const colorScheme of ['light', 'dark']) {
  test(`code is legible and contained on narrow screens in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/code-blocks/');
    const example = files(page);
    await example.getByRole('button', { name: 'Copy code' }).scrollIntoViewIfNeeded();
    await expect(example.getByRole('button', { name: 'Copy code' })).toBeInViewport();
    await example.getByRole('tab', { name: 'styles.css' }).click();
    await expect(example.getByRole('tabpanel')).toBeVisible();
    const styles = await example.getByRole('tabpanel').evaluate(panel => {
      const code = getComputedStyle(panel.querySelector('code'));
      return { font: code.fontFamily, filter: getComputedStyle(panel).filter };
    });
    expect(styles.font).toContain('Geist Mono');
    expect(styles.filter).toBe('none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const fence = page.getByRole('group', { name: 'Code: button.tsx', exact: true });
    for (const token of ['export', '"Save"', '// A comment with 42 stays a comment.']) {
      const contrast = await fence.getByText(token, { exact: true }).evaluate(element => {
        const context = document.createElement('canvas').getContext('2d');
        function luminance(color) {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const [r, g, b] = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return r * 0.2126 + g * 0.7152 + b * 0.0722;
        }
        const foreground = luminance(getComputedStyle(element).color);
        const background = luminance(getComputedStyle(element.closest('[role="group"]')).backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('minified production HTML preserves clipboard source and tab navigation', async ({ page }) => {
  await mockClipboard(page);
  const destination = mkdtempSync(join(tmpdir(), 'owenps-code-blocks-'));
  try {
    execFileSync('hugo', ['--minify', '--contentDir', '../tests/fixtures', '--destination', destination], {
      cwd: new URL('../owensmith/', import.meta.url),
    });
    await page.route('**/code-blocks/', route => route.fulfill({
      path: join(destination, 'code-blocks/index.html'),
      contentType: 'text/html',
    }));
    await page.goto('/code-blocks/');
    await page.getByRole('group', { name: 'Code: button.tsx', exact: true }).getByRole('button', { name: 'Copy code' }).click();
    expect(await page.evaluate(() => window.copiedValues)).toEqual([buttonCode]);
    await files(page).getByRole('tab', { name: 'styles.css' }).click();
    await expect(files(page).getByRole('tabpanel')).toHaveAccessibleName('styles.css');
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('author line-number settings apply without JavaScript', async ({ page }) => {
    await page.goto('/code-block-options/');
    await expect(page.getByRole('group', { name: 'Code: plain.go', exact: true }).getByText('1', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Code: numbered.css', exact: true }).getByText('1', { exact: true })).toBeVisible();
    const example = files(page);
    await expect(example.getByRole('region', { name: 'unnumbered.js', exact: true }).getByText('1', { exact: true })).toHaveCount(0);
    await expect(example.getByRole('region', { name: 'numbered.css', exact: true }).getByText('1', { exact: true })).toBeVisible();
  });
  test('every file remains readable with no dead tab or copy controls', async ({ page }) => {
    await page.goto('/code-blocks/');
    const example = files(page);
    await expect(example.getByRole('region', { name: 'button.tsx', exact: true })).toContainText('export function Button()');
    await expect(example.getByRole('region', { name: 'styles.css', exact: true })).toContainText('height: 40px;');
    await expect(example.getByRole('button', { name: 'Copy code' })).toHaveCount(0);
    await expect(example.getByRole('button', { name: 'Line numbers', exact: true })).toHaveCount(0);
    await expect(example.getByRole('tab')).toHaveCount(0);
  });
});
