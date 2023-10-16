module.exports = {
  extends: ['@busybox'],
  overrides: [
    {
      files: ['./vite.config.ts', './cypress.config.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
  root: true,
  settings: {
    tailwindcss: {
      config: './tailwind.config.mjs',
    },
  },
};
