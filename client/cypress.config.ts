import { defineConfig } from 'cypress';

// Allow overriding the frontend base URL via env var. Defaults to http://localhost:4200
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

export default defineConfig({
  e2e: {
    baseUrl,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // return config in case other plugins rely on it
      return config;
    },
    projectId: '8687wo',
  },
});
