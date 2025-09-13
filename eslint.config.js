// ESLint Flat Config for TS/JS
// See: https://eslint.org/docs/latest/use/configure/configuration-files-new
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  // Turn off rules that might conflict with Prettier formatting
  prettier,
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
    plugins: {
      '@typescript-eslint': (await import('@typescript-eslint/eslint-plugin')).default,
    },
    rules: {
      // TypeScript handles these
      'no-undef': 'off',
      'no-unused-vars': 'off',
      // Prefer TS-aware unused vars check
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    },
  },
  {
    files: ['tests/**/*.test.*'],
    plugins: {
      vitest: (await import('eslint-plugin-vitest')).default,
    },
    rules: {
      // Allow test runner globals without extra plugins
      'no-undef': 'off',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];
