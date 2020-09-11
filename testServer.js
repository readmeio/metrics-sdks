/* eslint-disable global-require */
const assert = require('assert').strict;
const { AssertionError } = require('assert');
const expect = require('expect');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const toJsonSchema = require('@openapi-contrib/openapi-schema-to-json-schema');
const Ajv = require('ajv');
const bodyParser = require('body-parser');
const { isValidUUIDV4 } = require('is-valid-uuid-v4');

const metricsApi = require('./fixtures/openapi.json');
const harFixtures = require('./fixtures/har');

const port = 3000;
const baseLogUrl = 'https://docs.example.com';
// const apiKey = 'mockReadMeApiKey';
/* const group = {
  id: '5afa21b97011c63320226ef3',
  label: 'example user',
  email: 'user@example.com',
}; */

console.logx = obj => {
  console.log(require('util').inspect(obj, false, null, true /* enable colors */));
};

app.use((req, res, next) => {
  res.io = io;
  next();
});

app.use(bodyParser.json({}));

app.use((req, res, next) => {
  // Make sure all requests are authorized.
  const auth = req.header('authorization');
  if (!auth) {
    return res.status(401).json({
      message: 'You must pass in an API key',
    });
  }

  // Make sure that all requests have a well-formated user agent.
  const userAgent = req.header('user-agent');
  if (!userAgent) {
    return res.status(400).json({
      message: 'No user agent was supplied in a request from the SDK.',
    });
  } else if (userAgent !== 'readmeio/4.0.0') {
    // @todo split the UA and make sure that the first part is recognized and that the latter is valid semver
    return res.status(400).json({
      message: `An improperly formatted user agent (${userAgent}) was supplied. SDK user agents must be in a \`sdkName/versionSemver\` scheme.`,
    });
  }

  return next();
});

// ReadMe API calls
app.get('/readme-api/v1', (req, res) => {
  return res.json({
    baseUrl: baseLogUrl,
  });
});

// Metrics API calls
app.post('/metrics-api/v1/request', async (req, res) => {
  try {
    // Assert that we have the proper shell of a Metrics API call here
    const metricsSchema = {
      $id: 'readme-metrics.json',
      ...toJsonSchema(metricsApi.components.schemas.Request),
    };

    // `openapi-schema-to-json-schema` spits out draft-04 schemas, but AJV needs a bunch of custom handling in order to
    // deal with them, which if we don't add AJV will throw an "Error: no schema with key or ref
    // http://json-schema.org/draft-04/schema# error. However, if we just remove the `$schema` key from our schema, it'll
    // validate it just fine.
    //
    // Maybe not ideal, but it skirts us having to add a bunch of potential flaky boilerplate.
    //
    // @link https://github.com/ajv-validator/ajv/releases/tag/5.0.0
    delete metricsSchema.$schema;

    const ajv = new Ajv({ allErrors: true });
    ajv.addSchema(metricsSchema);

    const validate = ajv.getSchema('readme-metrics.json');

    assert.ok(
      validate(req.body),
      new AssertionError({
        message: 'Incoming Metrics payload does match what we expect it to look like.',
        actual: validate.errors,
        expected: {},
      })
    );

    await Promise.all(
      req.body.map(async payload => {
        // Determine that we have a group ID set to a test fixture.
        assert.ok(
          payload.group.id in harFixtures,
          new AssertionError({
            message: 'An unknown test fixture was set as `group.id` See the `fixtures/` directory for valid options.',
            actual: payload.group.id,
          })
        );

        const expected = harFixtures[payload.group.id];

        // Make sure that we have a valid UUIDs.
        const uuid = payload._id;
        assert.ok(
          isValidUUIDV4(uuid),
          new AssertionError({
            message: `An \`_id\` within the payload is not a valid v4 UUID.`,
            actual: uuid,
          })
        );

        assert.strictEqual(
          payload.request.log.entries.length,
          1,
          "Amount of request log entries in a HAR payload did not equal 1. This typically shouldn't happen?"
        );

        const entry = payload.request.log.entries[0];

        // Ensure that our payload response headers contains the `x-documentation-url` and that it contains the same UUID.
        assert.ok(entry.response.headers.length > 1, 'Entry response headers should have more than one entry.');

        const docsHeader = entry.response.headers.find(header => header.name === 'x-documentation-url');
        assert.ok(docsHeader, 'No `x-documentation-url` header could be located in the entry response headers');

        assert.strictEqual(
          docsHeader.value,
          `${baseLogUrl}/logs/${uuid}`,
          '`x-documentation-url` header is not what is expected.'
        );

        // Since our fake environment creates variable ports, we need to ensure that our pagerefs and URLs in the payload
        // are valid URLs.
        assert.strictEqual(new URL(entry.pageref).hostname, '127.0.0.1', 'Entry `pageref` should point to localhost.');
        assert.strictEqual(
          new URL(entry.request.url).hostname,
          '127.0.0.1',
          'Entry `request.url` should point to localhost.'
        );

        // Update our test fixture to contain the UUID we're working with, as well as allow dynamic matching on dates and
        // times.
        expected._id = uuid;
        expected.request.log.entries.forEach((ent, i) => {
          expected.request.log.entries[i].pageref = expect.any(String);
          expected.request.log.entries[i].request.headers = expect.any(Array);
          expected.request.log.entries[i].request.url = expect.any(String);
          expected.request.log.entries[i].response.headers = expect.any(Array);
          expected.request.log.entries[i].startedDateTime = expect.any(String);
          expected.request.log.entries[i].time = expect.any(Number);
        });

        try {
          await expect(payload).toStrictEqual(expected);
        } catch (err) {
          if (err.matcherResult && err.matcherResult.name !== 'toStrictEqual') {
            throw err;
          }

          throw new AssertionError({
            message: 'Payload does not line up with the test fixture.',
            actual: err.message,
          });
        }
      })
    );
  } catch (err) {
    if (!(err instanceof AssertionError)) {
      throw err;
    }

    res.io.emit('sdk-assertion', { success: false, reason: err.message, error: err });
    return res.sendStatus(200);
  }

  res.io.emit('sdk-assertion', { success: true });

  return res.sendStatus(200);
});

app.all('*', (req, res) => {
  return res.status(404).json({
    error: `Unknown or unmocked test runner endpoint accessed: ${req.path}`,
  });
});

// server.listen(port);
server.listen(port);
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

  console.log(`Listening on ${bind}`);
});
