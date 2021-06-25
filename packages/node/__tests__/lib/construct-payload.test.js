const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { isValidUUIDV4 } = require('is-valid-uuid-v4');
const packageJson = require('../../package.json');

const constructPayload = require('../../lib/construct-payload');

function createApp(options, existingPayload = { logId: uuidv4(), startedDateTime: new Date() }, group = () => {}) {
  const app = express();
  app.use(bodyParser.json());

  const router = express.Router();

  router.post('/a', (req, res) => res.json(constructPayload(req, res, group, options, existingPayload)));

  app.use('/test-base-path', router);

  app.post('/*', (req, res) => {
    res.json(constructPayload(req, res, group, options, existingPayload));
  });

  return app;
}

describe('constructPayload()', () => {
  it('should convert apiKey should take precedence over id field', () => {
    const apiKey = 'user_api_key';
    const group = () => ({
      apiKey: 'user_api_key',
      id: 'user_id',
      label: 'label',
      email: 'email',
    });
    return request(createApp(undefined, undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.group.id).toBe(apiKey);
        expect(body.group.apiKey).toBeUndefined();
      });
  });

  it('should still support id even though it has been deprecated in favor of apiKey', () => {
    const userId = 'user_id';
    const group = () => ({
      id: userId,
      label: 'label',
      email: 'email',
    });
    return request(createApp(undefined, undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.group.id).toBe(userId);
        expect(body.group.apiKey).toBeUndefined();
      });
  });

  it('should construct a har file from the request/response', () => {
    return request(createApp({ blacklist: ['password'] }))
      .post('/')
      .send({ password: '123456' })
      .expect(({ body }) => {
        expect(isValidUUIDV4(body._id)).toBe(true);
        expect(typeof body.request.log.entries[0].request).toBe('object');
        expect(typeof body.request.log.entries[0].response).toBe('object');
        expect(body.request.log.entries[0].request.postData).toStrictEqual({
          mimeType: 'application/json',
          text: '{"password":"[REDACTED 6]"}',
        });
      });
  });

  it('#creator', () =>
    request(createApp())
      .post('/')
      .expect(({ body }) => {
        expect(body.request.log.creator).toStrictEqual({
          name: packageJson.name,
          version: packageJson.version,
          comment: `${process.platform}/${process.version}`,
        });
      }));

  it('#clientIPAddress', () =>
    request(createApp())
      .post('/')
      .expect(({ body }) => {
        expect(body.clientIPAddress).toBe('::ffff:127.0.0.1');
      }));

  it('#pageref should be `req.route.path`', () =>
    request(createApp({}))
      .post('/')
      .expect(({ body }) => {
        expect(body.request.log.entries[0].pageref).toMatch(/http:\/\/127.0.0.1:\d+\/\*/);
      }));

  it('#pageref baseurl should be included as well', () =>
    request(createApp({}))
      .post('/test-base-path/a')
      .expect(({ body }) => {
        expect(body.request.log.entries[0].pageref).toMatch(/http:\/\/127.0.0.1:\d+\/test-base-path\/a/);
      }));

  it('#startedDateTime', () => {
    const startedDateTime = new Date();

    return request(createApp({}, { startedDateTime }))
      .post('/')
      .expect(({ body }) => {
        expect(new Date(body.request.log.entries[0].startedDateTime).toISOString()).toBe(startedDateTime.toISOString());
      });
  });

  it('#time', () => {
    const startedDateTime = new Date();

    return request(createApp({}, { startedDateTime }))
      .post('/')
      .expect(({ body }) => {
        expect(typeof body.request.log.entries[0].time).toBe('number');
        expect(body.request.log.entries[0].time).toBeGreaterThan(0);
      });
  });
});
