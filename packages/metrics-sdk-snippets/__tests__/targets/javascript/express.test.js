import express from '../../../src/targets/javascript/express';

test('should generate some code', () => {
  const snippet = express([]);
  expect(snippet).toMatch(/require\('express'\)/);
  expect(snippet).not.toMatch(/\/\ OAS Server variables/);
  expect(snippet).not.toMatch(/\/\ OAS Security variables/);
});

test('should render server variables', () => {
  const snippet = express([
    {
      name: 'name',
      default: 'default-name',
      source: 'server',
    },
    {
      name: 'port',
      default: '',
      source: 'server',
    },
  ]);

  expect(snippet).toMatch(/\/\ OAS Server variables/);
  expect(snippet).toMatch(/name: 'default-name'/);
  expect(snippet).toMatch(/port: 'port'/);
});

test('should render security variables', () => {
  const snippet = express([
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
  ]);

  expect(snippet).toMatch(/\/\ OAS Security variables/);
  expect(snippet).toMatch(/petstore_auth: 'default-key'/);
  // type: http defaults are ignored for now cos our extension doesn't support it
  expect(snippet).toMatch(/basic_auth: { user: 'user', pass: 'pass' }/);
});
