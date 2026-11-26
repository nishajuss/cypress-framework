import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import pluginCypress from 'eslint-plugin-cypress';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import globals from 'globals';

export default defineConfig(
  {
    ignores: ['node_modules/**', 'report/**', 'cypress/screenshots/**', 'cypress/videos/**', 'cypress/downloads/**'],
  },

  // JavaScript / TypeScript
  {
    files: ['**/*.{js,mjs,ts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { '@stylistic': stylistic },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'max-params': ['error', 4],
      'no-console': 'off',
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'off', // Chai assertions such as `.to.be.empty`

      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/space-before-blocks': ['error', 'always'],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/linebreak-style': ['error', 'unix'],
    },
  },

  // Cypress specs, step definitions, page objects and support files
  {
    files: ['cypress/**/*.ts'],
    extends: [pluginCypress.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // JSON
  ...eslintPluginJsonc.configs['flat/recommended-with-json'],
  {
    files: ['**/*.json'],
    rules: {
      'jsonc/indent': ['error', 2],
      'jsonc/object-curly-spacing': ['error', 'always'],
      'jsonc/array-bracket-spacing': ['error', 'never'],
      'jsonc/no-comments': 'error',
    },
  },
);
