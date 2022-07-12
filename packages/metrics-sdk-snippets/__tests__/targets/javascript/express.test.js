import express from '../../../src/targets/javascript/express';

test('should generate some code', () => {
  expect(express()).toMatch(/require\('express'\)/);
});
