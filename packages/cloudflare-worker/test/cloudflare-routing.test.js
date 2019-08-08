/* eslint-env mocha */
const assert = require('assert');
const matchRouteWhitelist = require('../lib/cloudflare-routing.js');
const globals = require('./service-worker-globals');

describe('cloudflare-routing()', () => {
  beforeEach(() => {
    Object.assign(global, globals());
  });

  it('should return false if no match for incoming url', () => {
    global.INSTALL_OPTIONS = {
      ROUTES: ['https://www.example.com/getTestDocs'],
    };

    assert.equal(matchRouteWhitelist('https://example.com/'), false);
  });

  it('should return false if url incorrectly matches wildcard path route', () => {
    global.INSTALL_OPTIONS = {
      ROUTES: ['https://test.example.com/docs/*'],
    };

    assert.equal(matchRouteWhitelist('https://test.example.com/api/myDoc'), false);
  });

  it('should return true if url is a complete match of reference route', () => {
    global.INSTALL_OPTIONS = {
      ROUTES: ['https://test.example.com/'],
    };

    assert.equal(matchRouteWhitelist('https://test.example.com/'), true);
  });

  it('should return true if url matches a domain reference wildcard', () => {
    global.INSTALL_OPTIONS = {
      ROUTES: ['https://*.example.com/'],
    };

    assert.equal(matchRouteWhitelist('https://test.example.com/'), true);
  });

  it('should return true if url matches a path reference wildcard', () => {
    global.INSTALL_OPTIONS = {
      ROUTES: ['https://test.example.com/*'],
    };

    assert.equal(matchRouteWhitelist('https://test.example.com/getTestDocs'), true);
  });

  it('should return true if url matches a path and domain reference wildcard', () => {
    global.INSTALL_OPTIONS = {
      ROUTES: ['https://*.example.com/docs/*'],
    };

    assert.equal(matchRouteWhitelist('https://test.example.com/docs/myDoc'), true);
  });

  it('should return true if wildcard appends required string for multiple cases', () => {
    global.INSTALL_OPTIONS = {
      ROUTES: ['https://www.example.com/docs*'],
    };

    assert.equal(matchRouteWhitelist('https://www.example.com/docs/myDoc'), true);
    assert.equal(matchRouteWhitelist('https://www.example.com/docs2'), true);
    assert.equal(matchRouteWhitelist('https://www.example.com/docs'), true);
  });
});
