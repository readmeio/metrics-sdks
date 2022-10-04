module.exports = {
  extends: ['@readme/eslint-config', '@readme/eslint-config/typescript'],
  plugins: ['node', '@typescript-eslint', 'import'],
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

    'no-underscore-dangle': [
      'error',
      {
        allow: ['_id', '_body', '__bodyCache', '_form_encoded', '_json', '_text', '_version'],
      },
    ],

    // We use `lodash` because it allows for more flexibility that we can't get with standard object accessors.
    'you-dont-need-lodash-underscore/get': 'off',
    'you-dont-need-lodash-underscore/omit': 'off',
  },
  overrides: [
    {
      files: ['examples/**/*.js'],
      rules: {
        // This was getting really weird in the examples/ folder
        // where I know `readmeio` isn't going to be resolvable yet.
        // In some versions of node that is true, but in others it's false
        // which was causing this rule to trigger 🤯
        'eslint-comments/no-unused-disable': 'off',
        // We don't want the top level eslint task to fail if the examples
        // folders are missing dependencies. These will be tested separately
        // during the integration testing step.
        'import/no-unresolved': 'off',
      },
    },
  ],
};
