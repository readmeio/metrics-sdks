import * as qs from 'querystring';

import get from 'lodash/get';
import merge from 'lodash/merge';
import pick from 'lodash/pick';
import set from 'lodash/set';

import { logger } from './logger';
/**
 * Ensure we have a string or undefined response for any header.
 *
 * @param header
 * @returns
 */
export function fixHeader(header: string[] | number | string): string | undefined {
  if (header === undefined) {
    return undefined;
  }

  if (Array.isArray(header)) {
    return header.join(',');
  }

  return String(header);
}

/**
 * Redacts a value by replacing it with a string like [REDACTED 6]
 *
 * @param value the value to be redacted
 * @returns A redacted string potentially containing the length of the original value, if it was a string
 */
export function redactValue(value: unknown) {
  const redactedVal = typeof value === 'string' ? ` ${value.length}` : '';
  return `[REDACTED${redactedVal}]`;
}

/**
 * Redacts all the properties in an object
 *
 * @param obj The data object that is operated upon
 * @param redactedPaths a list of paths that point values which should be redacted
 * @returns An object with the redacted values
 */
export function redactProperties<T extends Record<string, unknown>>(obj: T, redactedPaths: string[] = []): T {
  const nextObj = { ...obj };
  return redactedPaths.reduce((acc, path) => {
    const value = get(acc, path);
    if (value !== undefined) set(acc, path, redactValue(value));
    return acc;
  }, nextObj);
}

/**
 * @param obj The data object that is operated upon
 * @param cb A callback that is invoked for each value found, the return value being the next value that is set in the returned object
 * @returns An object with the replaced values
 */
export function replaceEach<T extends Record<string, unknown>>(
  obj: T,
  cb: (input: unknown) => string,
): Record<string, unknown> {
  return Object.keys(obj).reduce<Record<string, unknown>>((acc, key) => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      acc[key] = replaceEach(value as Record<string, unknown>, cb);
    } else if (value !== undefined) {
      acc[key] = cb(value);
    }
    return acc;
  }, {});
}

/**
 * Redacts everything but the provided fields
 *
 * @param obj The data object with fields to redact
 * @param nonRedactedPaths A list of all object paths that shouldn't be redacted
 * @returns A merged objects that is entirely redacted except for the values of the nonRedactedPaths
 */
export function redactOtherProperties<T extends Record<string, unknown>>(obj: T, nonRedactedPaths: string[]): T {
  const allowedFields = pick(obj, nonRedactedPaths);
  const redactedFields = obj ? replaceEach(obj, redactValue) : obj;
  return merge(redactedFields, allowedFields) as T;
}

export function isApplicationJson(mimeType: string) {
  if (!mimeType) {
    return false;
  }

  return (
    ['application/json', 'application/x-json', 'text/json', 'text/x-json'].includes(mimeType) ||
    mimeType.indexOf('+json') !== -1
  );
}

export function parseRequestBody(body: string, mimeType: string): Record<string, unknown> | string {
  if (mimeType === 'application/x-www-form-urlencoded') {
    return qs.parse(body);
  }

  if (isApplicationJson(mimeType)) {
    try {
      return JSON.parse(body);
    } catch (err) {
      logger.error({ message: 'Error parsing request body JSON.', err });
    }
  }

  return body;
}
