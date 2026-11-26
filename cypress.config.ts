import { defineConfig } from 'cypress';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import { loadEnv } from './scripts/loadEnv';

const env = loadEnv();

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  watchForFileChanges: false,
  video: false,
  screenshotOnRunFailure: true,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  env,
  expose: {
    // Restful Booker: the public site by default, or a local Docker copy (CI sets API_BASE_URL).
    apiBaseUrl: env.API_BASE_URL,
  },
  e2e: {
    baseUrl: 'https://www.saucedemo.com',
    specPattern: 'cypress/e2e/features/**/*.feature',
    async setupNodeEvents (on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }));

      return config;
    },
  },
});
