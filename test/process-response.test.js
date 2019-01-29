/* eslint-env mocha */
const express = require('express');
const request = require('supertest');
const assert = require('assert');
const bodyParser = require('body-parser');

const processResponse = require('../lib/process-response');

function testResponse(assertion, response) {
  const app = express();
  app.use(bodyParser.json());
  app.post('/*', (req, res) => {
    res.once('finish', assertion.bind(null, res));

    // This is done in the main middleware by
    // overwriting res.write/end
    res._body = response; // eslint-disable-line no-underscore-dangle

    res.json(response);
  });

  request(app)
    .post('/')
    .expect(200)
    .end();
}

describe('processResponse()', () => {
  describe('options', () => {
    it('should strip blacklisted properties', done => {
      testResponse(res => {
        assert.deepEqual(
          processResponse(res, { blacklist: ['password', 'apiKey'] }).content.text,
          JSON.stringify({ another: 'Hello world' }),
        );
        return done();
      }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
    });

    it('should only send whitelisted properties', done => {
      testResponse(res => {
        assert.deepEqual(
          processResponse(res, { whitelist: ['password', 'apiKey'] }).content.text,
          JSON.stringify({ password: '123456', apiKey: 'abcdef' }),
        );
        return done();
      }, JSON.stringify({ password: '123456', apiKey: 'abcdef', another: 'Hello world' }));
    });

    it('should not be applied for plain text bodies', done => {
      const body = 'hello world: dasdsas';
      testResponse(res => {
        assert.deepEqual(
          processResponse(res, { blacklist: ['password', 'apiKey'] }).content.text,
          JSON.stringify(body),
        );
        return done();
      }, body);
    });
  });

  it('#status', done =>
    testResponse(res => {
      assert.equal(processResponse(res).status, 200);
      return done();
    }));

  it('#statusText', done =>
    testResponse(res => {
      assert.equal(processResponse(res).statusText, 'OK');
      return done();
    }));

  it('#headers', done => {
    testResponse(res => {
      assert.deepEqual(processResponse(res).headers.filter(header => header.name !== 'date'), [
        { name: 'x-powered-by', value: 'Express' },
        {
          name: 'content-type',
          value: 'application/json; charset=utf-8',
        },
      ]);
      return done();
    });
  });

  describe('#content', () => {
    it('#size', done => {
      const body = { a: 1, b: 2, c: 3 };
      testResponse(res => {
        assert.deepEqual(processResponse(res).content.size, JSON.stringify(body).length);
        return done();
      }, body);
    });

    it('#mimeType', done =>
      testResponse(res => {
        assert.deepEqual(processResponse(res).content.mimeType, 'application/json; charset=utf-8');
        return done();
      }));

    it('#text', done => {
      const body = { a: 1, b: 2, c: 3 };
      testResponse(res => {
        assert.deepEqual(processResponse(res).content.text, JSON.stringify(body));
        return done();
      }, JSON.stringify(body));
    });

    it('#text should work with plain text body', done => {
      const body = 'hello world: dasdsas';
      testResponse(res => {
        assert.deepEqual(processResponse(res).content.text, JSON.stringify(body));
        return done();
      }, body);
    });
  });
});
