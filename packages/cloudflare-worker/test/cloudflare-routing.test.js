import { describe, beforeEach, expect, it } from 'vitest';

import matchRouteWhitelist from '../src/lib/cloudflare-routing';

import globals from './service-worker-globals';

describe('cloudflare-routing()', function () {
  beforeEach(function () {
    Object.assign(global, globals());
  });

  it('should return false if no match for incoming url', function () {
    global.INSTALL_OPTIONS = {
      routes: ['https://www.example.com/getTestDocs'],
    };

    expect(matchRouteWhitelist('https://example.com/')).toBe(false);
  });

  it('should return false if url incorrectly matches wildcard path route', function () {
    global.INSTALL_OPTIONS = {
      routes: ['https://test.example.com/docs/*'],
    };

    expect(matchRouteWhitelist('https://test.example.com/api/myDoc')).toBe(false);
  });

  it('should return true if url is a complete match of reference route', function () {
    global.INSTALL_OPTIONS = {
      routes: ['https://test.example.com/'],
    };

    expect(matchRouteWhitelist('https://test.example.com/')).toBe(true);
  });

  it('should return true if url matches a domain reference wildcard', function () {
    global.INSTALL_OPTIONS = {
      routes: ['https://*.example.com/'],
    };

    expect(matchRouteWhitelist('https://test.example.com/')).toBe(true);
  });

  it('should return true if url matches a path reference wildcard', function () {
    global.INSTALL_OPTIONS = {
      routes: ['https://test.example.com/*'],
    };

    expect(matchRouteWhitelist('https://test.example.com/getTestDocs')).toBe(true);
  });

  it('should return true if url matches a path and domain reference wildcard', function () {
    global.INSTALL_OPTIONS = {
      routes: ['https://*.example.com/docs/*'],
    };

    expect(matchRouteWhitelist('https://test.example.com/docs/myDoc')).toBe(true);
  });

  it('should return true if wildcard appends required string for multiple cases', function () {
    global.INSTALL_OPTIONS = {
      routes: ['https://www.example.com/docs*'],
    };

    expect(matchRouteWhitelist('https://www.example.com/docs2')).toBe(true);
    expect(matchRouteWhitelist('https://www.example.com/docs')).toBe(true);
  });
});
