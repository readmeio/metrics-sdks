import * as http from 'http';

import { expect } from 'chai';
import request from 'supertest';

import processResponse from '../../src/lib/process-response';

interface TestServerResponse extends http.ServerResponse {
  __bodyCache?: string;
}

function testResponse(
  assertion: (res: TestServerResponse) => void,
  response?: string,
  resContentType = 'application/json'
) {
  const requestListener = function (req: http.IncomingMessage, res: TestServerResponse) {
    // Have to do this otherwise the request is never read
    // and the tests timeout
    req.on('readable', function () {
      // no-op
    });

    req.on('end', function () {
      res.setHeader('Content-Type', resContentType);
      res.setHeader('etag', 'ajh4kjthklu3qa4h5tkjlha3214');
      res.setHeader('last-modified', 'Thu, 01 Jan 1970 00:00:00 GMT');
      if (response) {
        res.setHeader('content-length', response.length);
      }

      res.__bodyCache = response;
      res.on('finish', assertion.bind(null, res));
      res.end(response);
    });
  };

  return request(http.createServer(requestListener)).post('/').expect(200);
}

describe('processResponse()', function () {
  describe('options', function () {
    describe('blacklist/whitelist in body', function () {
      it('should strip blacklisted properties in body', function () {
        return testResponse(res => {
          expect(
            processResponse(res, res.__bodyCache, { blacklist: ['password', 'apiKey'] }).content.text
          ).to.deep.equal(JSON.stringify({ another: 'Hello world' }));
        }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
      });

      it('should strip blacklisted nested properties in body', function () {
        return testResponse(res => {
          expect(processResponse(res, res.__bodyCache, { blacklist: ['a.b.c'] }).content.text).to.deep.equal(
            JSON.stringify({ a: { b: {} } })
          );
        }, JSON.stringify({ a: { b: { c: 1 } } }));
      });

      it('should only send whitelisted properties in body', function () {
        return testResponse(res => {
          expect(
            processResponse(res, res.__bodyCache, { whitelist: ['password', 'apiKey'] }).content.text
          ).to.deep.equal(JSON.stringify({ password: '123456', apiKey: 'abcdef' }));
        }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
      });

      it('should only send whitelisted nested properties in body', function () {
        return testResponse(res => {
          expect(processResponse(res, res.__bodyCache, { whitelist: ['a.b.c'] }).content.text).to.deep.equal(
            JSON.stringify({ a: { b: { c: 1 } } })
          );
        }, JSON.stringify({ a: { b: { c: 1 } }, d: 2 }));
      });

      it('should ignore whitelist if blacklist is present', function () {
        return testResponse(res => {
          expect(
            processResponse(res, res.__bodyCache, {
              blacklist: ['password', 'apiKey'],
              whitelist: ['password', 'apiKey'],
            }).content.text
          ).to.deep.equal(JSON.stringify({ another: 'Hello world' }));
        }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
      });
    });

    describe('blacklist/whitelist in headers', function () {
      it('should strip blacklisted properties in headers', function () {
        return testResponse(res => {
          expect(processResponse(res, res.__bodyCache, { blacklist: ['etag', 'content-type'] }).headers).to.deep.equal([
            { name: 'last-modified', value: 'Thu, 01 Jan 1970 00:00:00 GMT' },
          ]);
        });
      });

      it('should only send whitelisted properties in headers', function () {
        return testResponse(res => {
          expect(processResponse(res, res.__bodyCache, { whitelist: ['last-modified'] }).headers).to.deep.equal([
            { name: 'last-modified', value: 'Thu, 01 Jan 1970 00:00:00 GMT' },
          ]);
        });
      });
    });

    describe('blacklist/whitelist in headers and body', function () {
      it('should strip blacklisted properties in headers and body', function () {
        return testResponse(res => {
          const processed = processResponse(res, res.__bodyCache, {
            blacklist: ['content-length', 'etag', 'content-type', 'password', 'apiKey'],
          });
          expect(processed.headers).to.deep.equal([{ name: 'last-modified', value: 'Thu, 01 Jan 1970 00:00:00 GMT' }]);
          expect(processed.content.text).to.deep.equal(JSON.stringify({ another: 'Hello world' }));
        }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
      });

      it('should whitelist properties in headers and body', function () {
        return testResponse(res => {
          const processed = processResponse(res, res.__bodyCache, {
            whitelist: ['last-modified', 'another'],
          });
          expect(processed.headers).to.deep.equal([{ name: 'last-modified', value: 'Thu, 01 Jan 1970 00:00:00 GMT' }]);
          expect(processed.content.text).to.deep.equal(JSON.stringify({ another: 'Hello world' }));
        }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
      });

      it('should ignore whitelist if there are blacklisted properties in headers and body', function () {
        return testResponse(res => {
          const processed = processResponse(res, res.__bodyCache, {
            blacklist: ['content-length', 'etag', 'content-type', 'password', 'apiKey'],
            whitelist: ['content-length', 'etag', 'content-type', 'password', 'apiKey'],
          });
          expect(processed.headers).to.deep.equal([{ name: 'last-modified', value: 'Thu, 01 Jan 1970 00:00:00 GMT' }]);
          expect(processed.content.text).to.deep.equal(JSON.stringify({ another: 'Hello world' }));
        }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
      });
    });

    it('should not be applied for plain text bodies', function () {
      const body = 'hello world: dasdsas';
      return testResponse(
        res => {
          expect(
            processResponse(res, res.__bodyCache, { blacklist: ['password', 'apiKey'] }).content.text
          ).to.deep.equal(JSON.stringify(body));
        },
        body,
        'text/plain'
      );
    });
  });

  it('#status', function () {
    return testResponse(res => {
      expect(processResponse(res, res.__bodyCache).status).to.equal(200);
    });
  });

  it('#statusText', function () {
    return testResponse(res => {
      expect(processResponse(res, res.__bodyCache).statusText).to.equal('OK');
    });
  });

  it('#headers', function () {
    return testResponse(res => {
      expect(processResponse(res).headers.filter(header => header.name !== 'date')).to.deep.equal([
        {
          name: 'content-type',
          value: 'application/json',
        },
        {
          name: 'etag',
          value: 'ajh4kjthklu3qa4h5tkjlha3214',
        },
        {
          name: 'last-modified',
          value: 'Thu, 01 Jan 1970 00:00:00 GMT',
        },
      ]);
    });
  });

  describe('#content', function () {
    it('#size', function () {
      const body = JSON.stringify({ a: 1, b: 2, c: 3 });
      return testResponse(res => {
        // `.content.size` returns a string, while `.length` is integer, and Jest doesn't have any
        // assertions that do just a `==` so we need to coax the response a bit.
        expect(processResponse(res, res.__bodyCache).content.size).to.equal(JSON.stringify(body).length);
      }, JSON.stringify(body));
    });

    it('#mimeType', function () {
      return testResponse(res => {
        expect(processResponse(res, res.__bodyCache).content.mimeType).to.equal('application/json');
      });
    });

    it('#text', function () {
      const body = JSON.stringify({ a: 1, b: 2, c: 3 });
      return testResponse(res => {
        expect(processResponse(res, res.__bodyCache).content.text).to.deep.equal(body);
      }, body);
    });

    it('#text should work with plain text body', function () {
      const body = 'hello world: dasdsas';
      return testResponse(
        res => {
          expect(processResponse(res, res.__bodyCache).content.text).to.deep.equal(JSON.stringify(body));
        },
        body,
        'text/plain'
      );
    });
  });
});
