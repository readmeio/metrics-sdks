import express from '../../../src/targets/javascript/express';

test('should generate some code', () => {
  const snippet = express([]);
  expect(snippet).toMatch(/require\('express'\)/);
});
