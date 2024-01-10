import busyboxEslintConfig, { globals } from '@busybox/eslint-config';

export default [
  {
    ignores: ['package-lock.json', 'bin/'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    rules: {
      'no-new': 'off',
    },
  },
  ...busyboxEslintConfig,
];
