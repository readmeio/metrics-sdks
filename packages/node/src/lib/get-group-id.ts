import type { ApiKey } from '../index';

/**
 * Gets the group ID from the keys array
 *
 * @param keys
 * @param securitySchemes
 * @returns {string|string}
 */
const getFromKeys = (keys = [], requestApiKey = '') => {
  if (!keys || !keys.length) {
    return undefined;
  }

  // Look for thr first key containing the requestApiKey
  const relevantKey =
    keys.find(key => {
      return Object.values(key).some(value => requestApiKey === value);
    }) ?? keys[0];

  // TODO JIM - is it bad that apiKey takes priority over security schemes?
  // Seems like if they define a security scheme we should use it.
  const searchArray = [
    'id',
    'apiKey',
    ...Object.keys(relevantKey).filter(k => relevantKey[k] === requestApiKey),
    'name',
  ];
  const groupKey = searchArray.find(k => !!relevantKey[k]);
  if (!groupKey) {
    return undefined;
  }

  return relevantKey[groupKey];
};

/**
 * Gets the group ID from the user object
 */
const getFromUser = (user: any, requestApiKey = '') => {
  // TODO JIM - is it bad that apiKey takes priority over security schemes?
  // TODO JIM - no need to support this as we require keys
  // Seems like if they define a security scheme we should use it.
  const searchArray = ['id', 'apiKey', ...Object.keys(user).filter(k => user[k] === requestApiKey), 'email'];
  const groupKey = searchArray.find(k => !!user[k]);

  if (!groupKey) {
    return undefined;
  }

  return user[groupKey];
};

/**
 * Gets the group ID from the user object for the current operation.
 * It will first look in the keys array, then in the top level user object.
 *
 * When searching the keys array it will look for a key matching the following priority:
 * 1. The key containing the requestApiKey value
 * 2. The first key in the array
 *
 * If a key is found it will return the group ID matching the following priority:
 * 1. The key id
 * 2. The key apiKey
 * 3. The requestApiKey value if it is in the key object
 * 4. The key name
 *
 * If no key is found it will return the group ID from the user object matching the following priority:
 * 1. The user id
 * 2. The user apiKey
 * 3. The requestApiKey value if it is in the user object
 * 4. The user email
 */
export const getGroupId = (user: any, requestApiKey: string) => {
  if (!user) {
    return undefined;
  }

  const fromKeysArray = getFromKeys(user.keys, requestApiKey);

  if (fromKeysArray) {
    // groupId found in keys
    return fromKeysArray;
  }

  const fromUser = getFromUser(user, requestApiKey);
  if (fromUser) {
    // groupId found in user
    return fromUser;
  }

  return undefined;
};
