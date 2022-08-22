import codeConverter from './code-converter';

const codeSample = `
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.listen(3000);
`;

test('should convert code to a CodeBuilder instance', () => {
  expect(codeConverter(codeSample)).toMatchInlineSnapshot(`
    "
    blank()

    push(\\"import express from 'express';\\");

    blank()

    push('const app = express();');

    blank()

    push(\\"app.get('/', (req, res) => {\\");
    push('res.sendStatus(200);', 1);
    push('});');

    blank()

    push('app.listen(3000);');

    blank()
    "
  `);
});
