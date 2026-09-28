import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('production pages expose working floating navigation after scrolling', async ({ page }) => {
  const destination = mkdtempSync(join(tmpdir(), 'owenps-production-navigation-'));
  try {
    execFileSync('hugo', ['--minify', '--contentDir', '../tests/fixtures', '--destination', destination], {
      cwd: new URL('../owensmith/', import.meta.url),
    });
    // Serve production HTML; the existing test server supplies the shared static assets.
    await page.route('**/blog/floating-navigation/', route => route.fulfill({
      path: join(destination, 'blog/floating-navigation/index.html'),
      contentType: 'text/html',
    }));
    await page.goto('/blog/floating-navigation/');
    const navigation = page.getByRole('navigation', { name: 'Quick navigation', exact: true });
    await expect(navigation).toBeHidden();
    await page.mouse.wheel(0, 600);
    const opener = navigation.getByRole('button', { name: 'Open navigation', exact: true });
    await expect(opener).toBeInViewport();
    await opener.click();
    await expect(navigation.getByRole('link', { name: 'Home', exact: true })).toBeInViewport();
    await navigation.getByRole('button', { name: 'Back to top', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Main', exact: true })).toBeInViewport();
    await expect(navigation).toBeHidden();
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});
