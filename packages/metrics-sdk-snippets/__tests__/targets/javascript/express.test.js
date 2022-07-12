import express from '../../../src/targets/javascript/express';

test('should generate some code with parameters', () => {
  const snippet = express({
    server: ['name', 'port', 'basePath'],
    security: [
      { name: 'petstore_auth', type: 'oauth2' },
      { name: 'api_key', type: 'apiKey' },
      { name: 'basic_auth', type: 'http' },
    ],
  });
  expect(snippet).toMatch(/require\('express'\)/);
  expect(snippet).toMatch(/basePath: 'test123'/);
  expect(snippet).toMatch(/petstore_auth: 'apiKey'/);
  expect(snippet).toMatch(/basic_auth: { user: 'user', pass: 'pass' }/);

  console.log(snippet);
});
