import type { GroupingObject } from '../../src/lib/ReadMe';

import { describe, expect, it } from 'vitest';

import { getGroupByApiKey } from '../../src/lib/get-group-id';

const MOCK_USER = {
  id: 'user-id',
  apiKey: 'user-apiKey',
  name: 'user-name',
  email: 'user-email',
  securityScheme: 'user-securityScheme',
};

const mockUser = (keys: Record<string, unknown>[] = [], user = {}) => {
  return {
    ...MOCK_USER,
    ...user,
    keys,
  };
};

describe('#getGroupByApiKey', () => {
  it('returns undefined when no user is passed', () => {
    // @ts-expect-error deliberately passing in bad data
    const groupId = getGroupByApiKey(undefined, 'requestApiKey');
    expect(groupId).toBeUndefined();
  });

  it('returns undefined for a user without a keys array', () => {
    const groupId = getGroupByApiKey({} as GroupingObject, 'requestApiKey');
    expect(groupId).toBeUndefined();
  });

  it('returns undefined for a user with a null keys array', () => {
    // @ts-expect-error deliberately passing in bad data
    const groupId = getGroupByApiKey(mockUser(null), 'requestApiKey');
    expect(groupId).toBeUndefined();
  });

  it('returns undefined for a user with an object as the keys array', () => {
    const groupId = getGroupByApiKey({ keys: {} } as GroupingObject, 'requestApiKey');
    expect(groupId).toBeUndefined();
  });

  it('returns undefined for a user with a string as the keys array', () => {
    const groupId = getGroupByApiKey({ keys: 'broken' as unknown } as GroupingObject, 'requestApiKey');
    expect(groupId).toBeUndefined();
  });

  describe('with a matching requestApiKey within the keys array', () => {
    it('prioritises the key with the matching security scheme', () => {
      const user = mockUser([
        { id: 'key-1-id', name: 'key-1-name' },
        {
          id: 'key-2-id',
          name: 'key-2-name',
          otherField: 'requestApiKey',
        },
      ]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.id).toBe('key-2-id');
    });

    it('returns the id of the key as first priority', () => {
      const user = mockUser([{ id: 'key-1-id', name: 'key-1-name', otherField: 'requestApiKey' }]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.id).toBe('key-1-id');
    });

    it('returns the apiKey of the key as second priority', () => {
      const user = mockUser([
        {
          name: 'key-1-name',
          otherField: 'requestApiKey',
          apiKey: 'key-1-apiKey',
        },
      ]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.id).toBe('key-1-apiKey');
    });

    it('returns the value of the matching apiKey as the third priority', () => {
      const user = mockUser([{ otherField: 'requestApiKey' }]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.id).toBe('requestApiKey');
    });

    it('returns the basic user as the fourth priority', () => {
      const user = mockUser([{ user: 'basic-user', pass: 'basic-pass' }]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.id).toBe('basic-user');
    });

    it('returns the name of the key as fifth priority', () => {
      const user = mockUser([{ name: 'key-1-name' }]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.id).toBe('key-1-name');
    });

    it('supports having nested basic auth', () => {
      const user = mockUser([{ notRelevant: 'foo' }, { basic: { user: 'basic-user', pass: 'basic-pass' } }]);
      const groupId = getGroupByApiKey(user, 'basic-user');

      expect(groupId?.id).toBe('basic-user');
    });
  });

  describe('without a matching requestApiKey within the keys array', () => {
    it('uses the first key in the array', () => {
      const user = mockUser([
        { id: 'key-1-id', name: 'key-1-name' },
        {
          id: 'key-2-id',
          name: 'key-2-name',
        },
      ]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.id).toBe('key-1-id');
    });
  });

  describe('return the label from the keys array', () => {
    it('returns the label', () => {
      const user = mockUser([
        { id: 'key-1-id', label: 'key-1-name' },
        {
          id: 'key-2-id',
          label: 'key-2-name',
        },
      ]);
      const groupId = getGroupByApiKey(user, 'requestApiKey');

      expect(groupId?.label).toBe('key-1-name');
    });
  });
});
