import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    watch: false,
    isolate: true,
    include: ['tests/**/*.test.ts'],
  },
});

