import codeConverter from './code-converter';

const codeSample = `
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.listen(8000);
`;

test('should convert code to a CodeBuilder instance', () => {
  expect(codeConverter(codeSample)).toMatchInlineSnapshot(`
    "
    writer.blankLine();

    writer.writeLine(\\"import express from 'express';\\");

    writer.blankLine();

    writer.writeLine('const app = express();');

    writer.blankLine();

    writer.writeLine(\\"app.get('/', (req, res) => {\\");
    writer.indent(1).writeLine('res.sendStatus(200);');
    writer.writeLine('});');

    writer.blankLine();

    writer.writeLine('app.listen(8000);');

    writer.blankLine();
    "
  `);
});
