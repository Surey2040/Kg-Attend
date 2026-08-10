import reactHooks from 'eslint-plugin-react-hooks';
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/exhaustive-deps': 'warn' },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
];
