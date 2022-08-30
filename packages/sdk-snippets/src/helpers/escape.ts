export interface EscapeOptions {
  /**
   * The delimiter that will be used to wrap the string (and so must be escaped
   * when used within the string).
   * Defaults to "
   */
  delimiter?: string;

  /**
   * The char to use to escape the delimiter and other special characters.
   * Defaults to \
   */
  escapeChar?: string;

  /**
   * Whether newlines (\n and \r) should be escaped within the string.
   * Defaults to true.
   */
  escapeNewlines?: boolean;
}

/**
 * Escape characters within a value to make it safe to insert directly into a
 * snippet. Takes options which define the escape requirements.
 *
 * This is closely based on the JSON-stringify string serialization algorithm,
 * but generalized for other string delimiters (e.g. " or ') and different escape
 * characters (e.g. Powershell uses `)
 *
 * See https://tc39.es/ecma262/multipage/structured-data.html#sec-quotejsonstring
 * for the complete original algorithm.
 */
export function escapeString(rawValue: any, options: EscapeOptions = {}) {
  const { delimiter = '"', escapeChar = '\\', escapeNewlines = true } = options;

  const stringValue = rawValue.toString();

  return [...stringValue]
    .map(c => {
      if (c === '\b') {
        return `${escapeChar}b`;
      } else if (c === '\t') {
        return `${escapeChar}t`;
      } else if (c === '\n') {
        if (escapeNewlines) {
          return `${escapeChar}n`;
        }
        return c; // Don't just continue, or this is caught by < \u0020
      } else if (c === '\f') {
        return `${escapeChar}f`;
      } else if (c === '\r') {
        if (escapeNewlines) {
          return `${escapeChar}r`;
        }
        return c; // Don't just continue, or this is caught by < \u0020
      } else if (c === escapeChar) {
        return escapeChar + escapeChar;
      } else if (c === delimiter) {
        return escapeChar + delimiter;
      } else if (c < '\u0020' || c > '\u007E') {
        // Delegate the trickier non-ASCII cases to the normal algorithm. Some of these
        // are escaped as \uXXXX, whilst others are represented literally. Since we're
        // using this primarily for header values that are generally (though not 100%
        // strictly?) ASCII-only, this should almost never happen.
        return JSON.stringify(c).slice(1, -1);
      }
      return c;
    })
    .join('');
}

/**
 * Make a string value safe to insert literally into a snippet within single quotes,
 * by escaping problematic characters, including single quotes inside the string,
 * backslashes, newlines, and other special characters.
 *
 * If value is not a string, it will be stringified with .toString() first.
 */
export const escapeForSingleQuotes = (value: any) => escapeString(value, { delimiter: "'" });

/**
 * Make a string value safe to insert literally into a snippet within double quotes,
 * by escaping problematic characters, including double quotes inside the string,
 * backslashes, newlines, and other special characters.
 *
 * If value is not a string, it will be stringified with .toString() first.
 */
export const escapeForDoubleQuotes = (value: any) => escapeString(value, { delimiter: '"' });

function quotedString(str: string, doubleQuotes: boolean) {
  if (doubleQuotes) {
    return `"${str}"`;
  }

  return `'${str}'`;
}

/**
 * Safely escape and prepare a string to be used as an object key.
 *
 */
export function escapeForObjectKey(str: string, doubleQuotes = false) {
  const escaped = doubleQuotes ? escapeForDoubleQuotes(str) : escapeForSingleQuotes(str);

  // If this key doesn't start with an alpha character then we should always wrap it in quotes and
  // then run it through some escaping logic to make sure that it doesn't contain anything that
  // might break out of the quotes.
  if (!/^([A-Za-z]{1})/.test(str)) {
    return quotedString(escaped, doubleQuotes);
  } else if (escaped === str) {
    // If our key doesn't have any characters that might break out of quotes and requring escaping
    // but might have any non-alphanumeric characters in it that might not be able to be used as
    // a JS property key then we should wrap the key in quotes.
    if (/([^A-Za-z_0-9])/.test(str)) {
      return quotedString(str, doubleQuotes);
    }

    // If our key doesn't need to be escaped then we don't need to wrap it in quotes.
    return str;
  }

  return quotedString(str, doubleQuotes);
}
