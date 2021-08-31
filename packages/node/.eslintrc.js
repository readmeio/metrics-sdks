module.exports = {
  extends: ['@readme/eslint-config', '@readme/eslint-config/typescript'],
  plugins: ['node', '@typescript-eslint', 'import'],
  ignorePatterns: ['__tests__', 'dist'],
  root: true,
  rules: {
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_id', '_body'],
      },
    ],
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    'sonarjs/no-nested-template-literals': 'warn',
    // Disable requiring return types because it's too easy to broaden them by accident
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
