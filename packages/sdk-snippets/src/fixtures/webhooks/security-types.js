module.exports = [
  {
    name: 'api_key',
    default: 'default-api_key-key',
    source: 'security',
    type: 'apiKey',
  },
  {
    name: 'http_basic',
    default: 'default-http_basic-key',
    type: 'http',
    source: 'security',
    scheme: 'basic',
  },
  {
    name: 'http_bearer',
    default: 'default-http_bearer-key',
    type: 'http',
    source: 'security',
    scheme: 'bearer',
  },
  {
    name: 'oauth2',
    default: 'default-oauth2-key',
    source: 'security',
    type: 'oauth2',
  },
];
