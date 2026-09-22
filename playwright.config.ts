import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir:'tests/e2e', timeout:30000, retries:0, workers:2,
 use:{baseURL:'http://127.0.0.1:4321', trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome'],launchOptions:{args:['--enable-unsafe-swiftshader']}}},{name:'firefox',use:{...devices['Desktop Firefox']}},{name:'webkit',use:{...devices['Desktop Safari']}}],
 reporter:[['list'],['json',{outputFile:'artifacts/playwright-results.json'}]],
});
