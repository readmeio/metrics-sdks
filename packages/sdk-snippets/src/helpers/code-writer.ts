import CodeBlockWriter from 'code-block-writer';

import { escapeForDoubleQuotes, escapeForSingleQuotes } from './escape';

export class CodeWriter extends CodeBlockWriter {
  private ranges: {
    security?: Record<string, { line: number }>;
    server?: Record<string, { line: number }>;
  } = {};

  private _texts: string[] = [];

  getRanges = () => {
    return this.ranges;
  };

  recordRange = (type: 'security' | 'server', name: string) => {
    if (!this.ranges[type]) {
      this.ranges[type] = {};
    }

    this.ranges[type][name] = {
      // eslint-disable-next-line no-underscore-dangle
      line: this._texts.join('').trim().split(this.getOptions().newLine).length,
    };

    return this;
  };

  writeEscapedString = (str: string) => {
    if (this.getOptions().useSingleQuote) {
      return this.write(`'${escapeForSingleQuotes(str)}'`);
    }

    return this.write(`"${escapeForDoubleQuotes(str)}"`);
  };

  /**
   * Safely escape and write a string as an object key.
   *
   */
  writeObjectKey = (str: string) => {
    const { useSingleQuote } = this.getOptions();

    const escaped = useSingleQuote ? escapeForSingleQuotes(str) : escapeForDoubleQuotes(str);

    // If this key doesn't start with an alpha character then we should always wrap it in quotes and
    // then run it through some escaping logic to make sure that it doesn't contain anything that
    // might break out of the quotes.
    if (!/^([A-Za-z]{1})/.test(str)) {
      return this.write(useSingleQuote ? `'${escaped}'` : `"${escaped}"`);
    } else if (escaped === str) {
      // If our key doesn't have any characters that might break out of quotes and requring escaping
      // but might have any non-alphanumeric characters in it that might not be able to be used as
      // a JS property key then we should wrap the key in quotes.
      if (/([^A-Za-z_0-9])/.test(str)) {
        return this.write(useSingleQuote ? `'${str}'` : `"${str}"`);
      }

      // If our key doesn't need to be escaped then we don't need to wrap it in quotes.
      return this.write(str);
    }

    return this.write(useSingleQuote ? `'${str}'` : `"${str}"`);
  };
}
