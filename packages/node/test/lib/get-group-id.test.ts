import type { GroupingObject } from '../../src';
import type { Operation } from 'oas';

import { describe, expect, it, beforeEach } from 'vitest';

import { getGroupByApiKey, getGroupIdByOperation } from '../../src/lib/get-group-id';

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

const mockOperation = () => {
  return {
    getSecurity: (): Record<string, string[]>[] => [{ securityScheme: [] }],
  } as unknown as Operation;
};

describe('getGroupId', () => {
  describe('byOperation', () => {
    let operation: ReturnType<typeof mockOperation>;

    beforeEach(() => {
      operation = mockOperation();
    });

    it('returns undefined when no user is passed', () => {
      const groupId = getGroupIdByOperation(undefined, operation as Operation);
      expect(groupId).toBeUndefined();
    });

    describe('for a user with a keys array', () => {
      describe('with a matching security scheme within the keys array', () => {
        it('prioritises the key with the matching security scheme', () => {
          const user = mockUser([
            { id: 'key-1-id', name: 'key-1-name' },
            {
              id: 'key-2-id',
              name: 'key-2-name',
              securityScheme: 'key-2-securityScheme',
            },
          ]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('key-2-id');
        });

        it('returns the id of the key as first priority', () => {
          const user = mockUser([{ id: 'key-1-id', name: 'key-1-name', securityScheme: 'key-1-securityScheme' }]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('key-1-id');
        });

        it('returns the apiKey of the key as second priority', () => {
          const user = mockUser([
            {
              name: 'key-1-name',
              securityScheme: 'key-1-securityScheme',
              apiKey: 'key-1-apiKey',
            },
          ]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('key-1-apiKey');
        });

        it('returns the value of the matching security group as the third priority', () => {
          const user = mockUser([{ securityScheme: 'key-1-securityScheme' }]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('key-1-securityScheme');
        });

        it('returns the basic user as the fourth priority', () => {
          const user = mockUser([{ securityScheme: { user: 'basic-user', pass: 'basic-pass' } }]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('basic-user');
        });

        it('returns the name of the key as fifth priority', () => {
          const user = mockUser([{ name: 'key-1-name' }]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('key-1-name');
        });
      });

      describe('without a matching security scheme within the keys array', () => {
        it('uses the first key in the array', () => {
          const user = mockUser([
            { id: 'key-1-id', name: 'key-1-name' },
            {
              id: 'key-2-id',
              name: 'key-2-name',
            },
          ]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('key-1-id');
        });

        it('returns the basic user', () => {
          const user = mockUser([{ user: 'basic-user', pass: 'basic-pass' }]);
          const groupId = getGroupIdByOperation(user, operation as Operation);

          expect(groupId).toBe('basic-user');
        });
      });
    });

    describe('for a user without a keys array', () => {
      it('returns the id from user as the first priority', () => {
        const user = mockUser();
        const groupId = getGroupIdByOperation(user, operation as Operation);

        expect(groupId).toBe('user-id');
      });

      it('returns the apiKey from user as the second priority', () => {
        const user = mockUser([], { id: undefined, apiKey: '123' });
        const groupId = getGroupIdByOperation(user, operation as Operation);

        expect(groupId).toBe('123');
      });

      it('returns the matching security scheme from user as the third priority', () => {
        const user = mockUser([], { id: undefined, apiKey: undefined });
        const groupId = getGroupIdByOperation(user, operation as Operation);

        expect(groupId).toBe('user-securityScheme');
      });

      it('returns the basic user as the fourth priority', () => {
        const user = mockUser([], {
          id: undefined,
          apiKey: undefined,
          securityScheme: undefined,
          user: 'basic-user',
          pass: 'basic-pass',
        });
        const groupId = getGroupIdByOperation(user, operation as Operation);

        expect(groupId).toBe('basic-user');
      });

      it('returns the matching email from user as the fifth priority', () => {
        const user = mockUser([], { id: undefined, securityScheme: undefined, apiKey: undefined });
        const groupId = getGroupIdByOperation(user, operation as Operation);

        expect(groupId).toBe('user-email');
      });

      it('supports having basic auth as a security scheme', () => {
        const user = mockUser([], {
          id: undefined,
          apiKey: undefined,
          securityScheme: { user: 'basic-user', pass: 'basic-pass' },
        });
        const groupId = getGroupIdByOperation(user, operation as Operation);

        expect(groupId).toBe('basic-user');
      });

      it('does not error if the keys array is null', () => {
        const user = mockUser(null);
        const groupId = getGroupIdByOperation(user, operation as Operation);

        expect(groupId).toBe('user-id');
      });
    });
  });

  describe('byApiKey', () => {
    it('returns undefined when no user is passed', () => {
      const groupId = getGroupByApiKey(undefined, 'requestApiKey');
      expect(groupId).toBeUndefined();
    });

    it('returns undefined for a user without a keys array', () => {
      const groupId = getGroupByApiKey({} as GroupingObject, 'requestApiKey');
      expect(groupId).toBeUndefined();
    });

    it('returns undefined for a user with a null keys array', () => {
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

        expect(groupId.id).toBe('key-2-id');
      });

      it('returns the id of the key as first priority', () => {
        const user = mockUser([{ id: 'key-1-id', name: 'key-1-name', otherField: 'requestApiKey' }]);
        const groupId = getGroupByApiKey(user, 'requestApiKey');

        expect(groupId.id).toBe('key-1-id');
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

        expect(groupId.id).toBe('key-1-apiKey');
      });

      it('returns the value of the matching apiKey as the third priority', () => {
        const user = mockUser([{ otherField: 'requestApiKey' }]);
        const groupId = getGroupByApiKey(user, 'requestApiKey');

        expect(groupId.id).toBe('requestApiKey');
      });

      it('returns the basic user as the fourth priority', () => {
        const user = mockUser([{ user: 'basic-user', pass: 'basic-pass' }]);
        const groupId = getGroupByApiKey(user, 'requestApiKey');

        expect(groupId.id).toBe('basic-user');
      });

      it('returns the name of the key as fifth priority', () => {
        const user = mockUser([{ name: 'key-1-name' }]);
        const groupId = getGroupByApiKey(user, 'requestApiKey');

        expect(groupId.id).toBe('key-1-name');
      });

      it('supports having nested basic auth', () => {
        const user = mockUser([{ notRelevant: 'foo' }, { basic: { user: 'basic-user', pass: 'basic-pass' } }]);
        const groupId = getGroupByApiKey(user, 'basic-user');

        expect(groupId.id).toBe('basic-user');
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

        expect(groupId.id).toBe('key-1-id');
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

        expect(groupId.label).toBe('key-1-name');
      });
    });
  });
});
