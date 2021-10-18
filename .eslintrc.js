module.exports = {
  extends: ['@readme/eslint-config', '@readme/eslint-config/typescript'],
  plugins: ['node', '@typescript-eslint', 'import'],
  ignorePatterns: ['__tests__', 'dist'],
  root: true,
  rules: {
    // Disable requiring return types because it's too easy to broaden them by accident.
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',

    'import/no-unresolved': [
      'error',
      {
        ignore: [
          // We're just importing types, so we don't need this unresolved.
          'har-format',
        ],
      },
    ],

    'no-underscore-dangle': ['error', { allow: ['_id', '_body'] }],
    'sonarjs/no-nested-template-literals': 'warn',

    // We use `lodash` because it allows for more flexibility that we can't get with standard object accessors.
    'you-dont-need-lodash-underscore/get': 'off',
    'you-dont-need-lodash-underscore/omit': 'off',
  },
};
