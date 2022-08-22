module.exports = {
  moduleNameMapper: {
    '^@readme/cloudflare-worker$': '<rootDir>/src/index.js',
  },
  testMatch: ['**/__tests__/**/(*.)+(spec|test).[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
