import busyboxEslintConfig, {withConfigurationPrint, globals } from '@busybox/eslint-config';

export default withConfigurationPrint()([
  {
    ignores: [
      'package-lock.json',
      'dist/',
      'coverage/'
    ],
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
  ...busyboxEslintConfig
]);