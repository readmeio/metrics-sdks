module.exports = [
  {
    name: 'petstore_auth',
    default: 'default-key',
    source: 'security',
    type: 'oauth2',
  },
  {
    name: 'basic_auth',
    default: 'default',
    source: 'security',
    type: 'http',
  },
];
