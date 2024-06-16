import type { Request } from 'express';

import { describe, expect, it } from 'vitest';

import findAPIKey from '../../src/lib/find-api-key';

// TODO: These tests were written by GPT-4 so probabbly aren't the best
// Unless they are good, in which case I wrote them by hand
describe('findAPIKey', () => {
  it('returns the token when Authorization header with Bearer is present', () => {
    const req = {
      headers: {
        authorization: 'Bearer token',
      },
      query: {},
    } as unknown as Request;

    expect(findAPIKey(req)).toBe('token');
  });

  it('returns the username when Authorization header with Basic auth is present', () => {
    const req = {
      headers: {
        authorization: `Basic ${Buffer.from('username:password').toString('base64')}`,
      },
      query: {},
    } as unknown as Request;

    expect(findAPIKey(req)).toBe('username');
  });

  it('returns the key when custom api-key header is present', () => {
    const req = {
      headers: {
        'api-key': 'token',
      },
      query: {},
    } as unknown as Request;

    expect(findAPIKey(req)).toBe('token');
  });

  it('returns the key from query params when present', () => {
    const req = {
      headers: {},
      query: {
        api_key: 'token',
      },
    } as unknown as Request;

    expect(findAPIKey(req)).toBe('token');
  });

  it('throws when no key present', () => {
    const req = {
      headers: {},
      query: {},
    } as unknown as Request;

    expect(() => findAPIKey(req)).toThrow('test');
  });
});
