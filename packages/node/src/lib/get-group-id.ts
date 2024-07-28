import type { ApiKey, GroupingObject, KeyValue } from './ReadMe';
import type { Operation } from 'oas/operation';

import get from 'lodash/get';

/**
 * Parses the basic auth object to return the user
 */
const parseBasicAuth = (key: KeyValue): string | undefined => {
  if (typeof key === 'object' && 'user' in key) {
    return key.user;
  }

  if (typeof key === 'string') {
    return key;
  }

  return undefined;
};

/**
 * Finds the relevant key and its path for a given apiKey
 */
const findRelevantKey = (keys: ApiKey[], apiKey: string) => {
  // Recursive function to traverse the nested structure of ApiKey and find the path to a specific key
  const findPath = (obj: ApiKey | string | unknown, key: string, parentPath?: string): string | undefined => {
    if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).reduce((acc: string | undefined, k) => {
        // Construct the current path by appending the current key to the parent path
        const currentPath = parentPath ? `${parentPath}.${k}` : k;
        // Continue searching down the tree
        return acc || findPath((obj as ApiKey)[k], key, currentPath);
      }, undefined);
    }

    // If the current object is equal to the key, return the parent path
    if (obj === key) {
      return parentPath;
    }

    return undefined;
  };

  // Reduce the array of ApiKeys to find the relevant key and its path
  return keys.reduce(
    (acc: { path?: string; relevantKey?: ApiKey }, item) => {
      const path = findPath(item, apiKey);
      // If the path is found, return the relevantKey and path
      if (path !== undefined) {
        return { relevantKey: item, path };
      }

      return acc;
    },
    // Initialize the accumulator with the first key and undefined path
    { relevantKey: keys[0], path: undefined },
  );
};

/**
 * Builds a flattened array of security requirements for an operation.
 */
const buildFlattenedSecurityRequirements = (operation: Operation): string[] => {
  if (!operation) {
    return [];
  }

  const securityRequirements = operation.getSecurity();
  return securityRequirements.reduce((acc: string[], curr) => {
    return [...acc, ...Object.keys(curr)];
  }, []);
};

/**
 * Gets the group ID from the keys array for a given security scheme
 */
const getGroupFromKeysBySecuritySchemes = (keys: ApiKey[] = [], securitySchemes: string[] = []) => {
  if (!keys || !keys.length) {
    return undefined;
  }

  // Look for thr first key containing a security scheme
  const relevantKey =
    keys.find(key => {
      return [...securitySchemes].some(keyName => key[keyName]);
    }) ?? keys[0];

  const groupKey = ['id', 'apiKey', ...securitySchemes, 'user', 'label', 'name'].find(k => !!relevantKey[k]);
  if (!groupKey) {
    return undefined;
  }

  return parseBasicAuth(relevantKey[groupKey] as KeyValue);
};

/**
 * Gets the group ID from the keys array for a given apiKey
 */
const getGroupFromKeysByApiKey = (keys: ApiKey[] = [], apiKey = '') => {
  if (!keys || !Array.isArray(keys)) {
    return undefined;
  }

  const { relevantKey, path } = findRelevantKey(keys, apiKey);
  const searchArray = ['id', 'apiKey', path || '', 'user', 'label', 'name'];

  const groupKey = searchArray.find(k => get(relevantKey, k));
  if (!groupKey) {
    return undefined;
  }

  return {
    id: get(relevantKey, groupKey) as string,
    label: get(relevantKey, 'label') || get(relevantKey, 'name'),
  };
};

/**
 * Gets the group ID from the user object for a given security scheme
 */
const getFromUser = (user: GroupingObject, securitySchemes: string[]): string | undefined => {
  const groupKey = ['id', 'apiKey', ...securitySchemes, 'user', 'email'].find(k => !!user[k]);

  if (!groupKey) {
    return undefined;
  }

  return parseBasicAuth(user[groupKey] as KeyValue);
};

/**
 * Gets the group ID from the user object for a given apiKey
 * It will search in the keys array of the user object
 *
 * When searching the keys array it will look for a key matching the following priority:
 * 1. The key containing the requestApiKey value
 * 2. The first key in the array
 *
 * If a key is found it will return the group ID matching the following priority:
 * 1. The key "id"
 * 2. The key "apiKey"
 * 3. The requestApiKey value if it is in the key object
 * 4. The key "user" (for basic auth)
 * 5. The key "label"
 * 6. The key "name"
 */
export const getGroupByApiKey = (user: GroupingObject, apiKey: string) => {
  if (!user) {
    return undefined;
  }

  const fromKeysArray = getGroupFromKeysByApiKey(user.keys, apiKey);

  if (fromKeysArray) {
    // groupId found in keys
    return fromKeysArray;
  }

  return undefined;
};

/**
 * Gets the group ID from the user object for the current operation.
 * It will first look in the keys array, then in the top level user object.
 *
 * When searching the keys array it will look for a key matching the following priority:
 * 1. The key contains the security scheme name for the operation
 * 2. The first key in the array
 *
 * If a key is found it will return the group ID matching the following priority:
 * 1. The key "id"
 * 2. The key "apiKey"
 * 3. The key matching security scheme value
 * 4. The key "user" (for basic auth)
 * 5. The key "label" (for basic auth)
 * 6. The key "name"
 *
 * If no key is found it will return the group ID from the user object matching the following priority:
 * 1. The user "id"
 * 2. The user "apiKey"
 * 3. The user matching security scheme value
 * 4. The user "user" (for basic auth)
 * 5. The user "email"
 */
export const getGroupIdByOperation = (user: GroupingObject, operation: Operation) => {
  if (!user) {
    return undefined;
  }

  const flattenedSecurityRequirements = buildFlattenedSecurityRequirements(operation);

  const fromKeysArray = getGroupFromKeysBySecuritySchemes(user.keys, flattenedSecurityRequirements);

  if (fromKeysArray) {
    // groupId found in keys
    return fromKeysArray;
  }

  const fromUser = getFromUser(user, flattenedSecurityRequirements);
  if (fromUser) {
    // groupId found in user
    return fromUser;
  }

  return undefined;
};
