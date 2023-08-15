import pick from "lodash/pick";
import merge from "lodash/merge";
import get from "lodash/get";
import set from "lodash/set";

/**
 * Redacts everything but the provided fields
 *
 * @param obj The data object with fields to redact
 * @param nonRedactedPaths A list of all object paths that shouldn't be redacted
 * @returns A merged objects that is entirely redacted except for the values of the nonRedactedPaths
 */
export function redactOtherProperties<T extends Record<string, unknown>>(obj: T, nonRedactedPaths): T {
  const allowedFields = pick(obj, nonRedactedPaths);
  const redactedFields = obj ? replaceEach(obj, redactValue) : obj;
  return merge(redactedFields, allowedFields);
}

/**
 * Redacts all the properties in an object
 *
 * @param obj The data object that is operated upon
 * @param redactedPaths a list of paths that point values which should be redacted
 * @returns An object with the redacted values
 */
export function redactProperties<T extends Record<string, unknown>>(obj: T, redactedPaths = []): T {
  const nextObj = {...obj};
  return redactedPaths.reduce((acc, path) => {
    const value = get(acc, path);
    if (value !== undefined) set(acc, path, redactValue(value));
    return acc;
  }, nextObj);
}

/**
 * Redacts a value by replacing it with a string like [REDACTED 6]
 *
 * @param value the value to be redacted
 * @returns A redacted string potentially containing the length of the original value, if it was a string
 */
function redactValue(value: string) {
  const redactedVal = typeof value === 'string' ? ` ${value.length}` : '';
  return `[REDACTED${redactedVal}]`;
}

/**
 * @param obj The data object that is operated upon
 * @param cb A callback that is invoked for each value found, the return value being the next value that is set in the returned object
 * @returns An object with the replaced values
 */
function replaceEach(obj, cb): Record<string, unknown> {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      acc[key] = replaceEach(value, cb);
    } else if (value !== undefined) {
      acc[key] = cb(value);
    }
    return acc;
  }, {});
}