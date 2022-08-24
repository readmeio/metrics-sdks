import { basename } from 'node:path';
import process from 'process';

async function getStdin() {
  if (process.stdin.isTTY) return null;

  const result = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of process.stdin) {
    result.push(chunk);
  }

  return result.join('');
}

function processLine(line) {
  if (line === '') {
    return '\nwriter.blankLine();\n';
  }

  const indentation = line.search(/\S|$/) / 2;
  const quote = line.match(/'/) ? '"' : "'";

  if (indentation === 0) {
    return `writer.writeLine(${quote}${line.trimLeft()}${quote});`;
  }

  return `writer.indent(${indentation}).writeLine(${quote}${line.trimLeft()}${quote});`;
}

export default function main(input) {
  return input
    .toString()
    .split('\n')
    .map(line => processLine(line))
    .join('\n');
}

if (basename(process.argv[1]) === 'code-converter.ts') {
  (async () => {
    const stdin = await getStdin();
    if (!stdin) {
      // eslint-disable-next-line no-console
      console.error('You must pipe something into this file');
      return process.exit(1);
    }

    // eslint-disable-next-line no-console
    return console.log(main(stdin));
  })();
}
