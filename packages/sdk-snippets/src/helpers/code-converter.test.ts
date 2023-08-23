import { describe, it, expect } from 'vitest';

import codeConverter from './code-converter';

const codeSample = `
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.listen(8000);
`;

describe('code-converter', function () {
  it('should convert code to a CodeBuilder instance', function () {
    expect(codeConverter(codeSample)).to.toMatchSnapshot();
  });
});
