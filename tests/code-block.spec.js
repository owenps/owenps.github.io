import { test, expect } from '@playwright/test';

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

test('ordinary, plain, and unknown-language fences copy exact source', async ({ page }) => {
  await mockClipboard(page);
  await page.goto('/code-blocks/');
  const example = page.getByRole('group', { name: 'Code: button.tsx', exact: true });
  await expect(example.getByRole('region', { name: 'button.tsx', exact: true })).toContainText('export function Button()');
  await example.getByRole('button', { name: 'Copy code' }).click();
  await expect(example.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => window.copiedValues)).toEqual([buttonCode]);

  await page.getByRole('group', { name: 'Code: text', exact: true }).getByRole('button', { name: 'Copy code' }).click();
  await page.getByRole('group', { name: 'Code: not-a-language', exact: true }).getByRole('button', { name: 'Copy code' }).click();
  expect(await page.evaluate(() => window.copiedValues.slice(1))).toEqual(['plain <text> & "quotes"\n\n  indented', 'still readable']);
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

test('copy uses the active file and preserves escaped code as text', async ({ page }) => {
  await mockClipboard(page);
  await page.goto('/code-blocks/');
  const example = files(page);
  await example.getByRole('tab', { name: 'styles.css' }).click();
  await example.getByRole('button', { name: 'Copy code' }).click();
  const copied = await page.evaluate(() => window.copiedValues.at(-1));
  expect(copied).toMatch(/^\/\* Strong ease-out/);
  expect(copied).toContain('height: 40px;');
  expect(copied).toMatch(/\n}$/);
  await example.getByRole('tab', { name: 'button.tsx', exact: true }).click();
  await expect(example.getByRole('status')).toBeEmpty();
  await example.getByRole('button', { name: 'Copy code' }).click();
  expect(await page.evaluate(() => window.copiedValues.at(-1))).toContain('\n\n  const message = "<script>window.codeExecuted = true</script> & </template>";');
  expect(await page.evaluate(() => window.codeExecuted)).toBeUndefined();
});

test('author options hide line numbers or headers without losing code', async ({ page }) => {
  await mockClipboard(page);
  await page.goto('/code-block-options/');
  const fence = page.getByRole('group', { name: 'Code: plain.go', exact: true });
  await expect(fence.getByText('1', { exact: true })).toHaveCount(0);
  await fence.getByRole('button', { name: 'Copy code' }).click();
  expect(await page.evaluate(() => window.copiedValues)).toEqual(['func main() {\n  run()\n}']);
  const plain = page.getByRole('group', { name: 'Code: plain.txt', exact: true });
  await expect(plain.getByRole('button')).toHaveCount(0);
  await expect(plain.getByRole('region')).toContainText('plain <text> & "quotes"');
  const example = files(page);
  await expect(example.getByRole('tabpanel').getByText('1', { exact: true })).toHaveCount(0);
  await example.getByRole('tab', { name: 'numbered.css', exact: true }).click();
  await expect(example.getByRole('tabpanel').getByText('1', { exact: true })).toBeVisible();
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

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every file remains readable with no dead tab or copy controls', async ({ page }) => {
    await page.goto('/code-blocks/');
    const example = files(page);
    const button = example.getByRole('region', { name: 'button.tsx', exact: true });
    const css = example.getByRole('region', { name: 'styles.css', exact: true });
    await expect(button).toBeVisible();
    await expect(button).toContainText('export function Button()');
    await expect(css).toBeVisible();
    await expect(css).toContainText('height: 40px;');
    await expect(page.getByRole('button', { name: 'Copy code' })).toHaveCount(0);
    await expect(example.getByRole('tab')).toHaveCount(0);
  });
});
