import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const productionDirectory = resolve(tmpdir(), 'owenps-production-tests');

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    headless: true,
  },
  webServer: [
    {
      command: `hugo server --contentDir ../tests/fixtures --port 4175 --bind 127.0.0.1 --disableLiveReload --destination "${resolve(tmpdir(), 'owenps-hover-card-tests')}"`,
      cwd: resolve('owensmith'),
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
    },
    {
      command: `hugo --minify --cleanDestinationDir --baseURL http://127.0.0.1:4176/ --destination "${productionDirectory}" && python3 -m http.server 4176 --bind 127.0.0.1 --directory "${productionDirectory}"`,
      cwd: resolve('owensmith'),
      url: 'http://127.0.0.1:4176',
      reuseExistingServer: false,
    },
  ],
});
