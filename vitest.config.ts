import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    // jsdom covers both lib and component tests
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Gate the testable logic in src/lib. Client hooks, font/IO glue, and the
      // motion constant table are exercised by the app / e2e, not unit tests, so
      // they would only dilute the number.
      include: ['src/lib/**'],
      exclude: [
        'src/lib/use-*.ts',
        'src/lib/og-fonts.ts',
        'src/lib/mock-data.ts',
        'src/lib/motion.ts',
        'src/lib/**/*.test.ts',
      ],
      // A ratchet, set just under current coverage. Raise as coverage grows;
      // do not lower it.
      thresholds: {
        statements: 72,
        branches: 65,
        functions: 78,
        lines: 73,
      },
    },
  },
});
