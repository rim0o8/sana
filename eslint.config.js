// ESLint Flat Config for TS/JS
// See: https://eslint.org/docs/latest/use/configure/configuration-files-new
import js from '@eslint/js';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: (await import('@typescript-eslint/parser')).default,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: false,
      },
    },
    rules: {
      // TypeScript handles these
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['tests/**/*.test.*'],
    rules: {
      // Allow test runner globals without extra plugins
      'no-undef': 'off',
    },
  },
];
