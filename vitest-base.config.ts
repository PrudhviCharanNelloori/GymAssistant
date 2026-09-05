import { defineConfig } from 'vitest/config';

/**
 * The workspace folder name ends with `]`, which breaks Vitest glob matching
 * when Angular absolutizes include paths. Escape `]` so tests resolve.
 */
function escapeGlobPath(value: string): string {
  return value.replace(/\]/g, '\\]');
}

export default defineConfig({
  plugins: [
    {
      name: 'escape-glob-brackets',
      config(userConfig) {
        const test = userConfig.test;
        if (!test) {
          return;
        }

        if (Array.isArray(test.include)) {
          test.include = test.include.map((pattern) =>
            typeof pattern === 'string' ? escapeGlobPath(pattern) : pattern,
          );
        }

        if (Array.isArray(test.exclude)) {
          test.exclude = test.exclude.map((pattern) =>
            typeof pattern === 'string' ? escapeGlobPath(pattern) : pattern,
          );
        }
      },
    },
  ],
});
