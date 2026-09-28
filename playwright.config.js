import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    headless: true,
  },
  webServer: {
    command: `hugo server --contentDir ../tests/fixtures --port 4175 --bind 127.0.0.1 --disableLiveReload --destination "${resolve(tmpdir(), 'owenps-hover-card-tests')}"`,
    cwd: resolve('owensmith'),
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
});
