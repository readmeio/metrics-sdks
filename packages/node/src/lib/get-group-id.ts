import type { ApiKey, GroupingObject, KeyValue } from '../index';
import type { Operation } from 'oas';

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

const getGroupFromKeysBySecuritySchemes = (keys: ApiKey[] = [], securitySchemes: string[] = []) => {
  if (!keys || !keys.length) {
    return undefined;
  }

  // Look for thr first key containing a security scheme
  const relevantKey =
    keys.find(key => {
      return [...securitySchemes].some(keyName => key[keyName]);
    }) ?? keys[0];

  const groupKey = ['id', 'apiKey', ...securitySchemes, 'user', 'name'].find(k => !!relevantKey[k]);
  if (!groupKey) {
    return undefined;
  }

  return parseBasicAuth(relevantKey[groupKey] as KeyValue);
};

/**
 * Gets the group ID from the keys array
 */
const getGroupFromKeysByApiKey = (keys: ApiKey[] = [], apiKey = ''): string | undefined => {
  if (!keys || !keys.length) {
    return undefined;
  }

  // Look for the first key containing the apiKey
  const relevantKey =
    keys.find(key => {
      return Object.values(key).some(value => apiKey === value);
    }) ?? keys[0];

  const searchArray = ['id', 'apiKey', ...Object.keys(relevantKey).filter(k => relevantKey[k] === apiKey), 'name'];
  const groupKey = searchArray.find(k => !!relevantKey[k]);
  if (!groupKey) {
    return undefined;
  }

  return relevantKey[groupKey] as string;
};

/**
 * Gets the group ID from the user object
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
 * The key "user" (for basic auth)
 * 4. The key "name"
 */
export const getGroupIdByApiKey = (user: GroupingObject, apiKey: string) => {
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
 * 4. The key "name"
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
