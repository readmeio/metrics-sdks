import type { ApiKey, GroupingObject } from './ReadMe';

import get from 'lodash/get';

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
