import busyboxEslintConfig, { globals } from '@busybox/eslint-config';
import eslintPluginImport from '@busybox/eslint-config/plugins/eslint-plugin-import';

export default [
  {
    ignores: ['package-lock.json', 'dist'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    settings: {
      tailwindcss: {
        config: './tailwind.config.mjs',
      },
    },
  },
  {
    plugins: {
      import: eslintPluginImport,
    },
    files: ['./tailwind.config.mjs', './vite.config.ts', './cypress.config.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  ...busyboxEslintConfig,
];
