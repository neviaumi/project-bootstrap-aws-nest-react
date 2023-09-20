module.exports = {
  extends: ['@busybox'],
  root: true,
  overrides: [
    {
      files: [
        './vite.config.ts',
        './cypress.config.ts',
      ],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
  settings: {
    tailwindcss: {
      config: './tailwind.config.mjs',
    },
  },
};