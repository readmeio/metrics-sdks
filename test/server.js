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

const metricsApi = require('./openapi.json');
const harFixtures = require('./payloads');

const port = 3000;
const baseLogUrl = 'https://docs.example.com';

let bufferedSet = 1;

app.use(bodyParser.json({}));
app.use((req, res, next) => {
  res.io = io;
  next();
});

app.use((req, res, next) => {
  const auth = req.header('authorization');
  if (!auth) {
    return res.status(401).json({
      message: 'You must pass in an API key',
    });
  }

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

app.get('/readme-api/v1', (req, res) => {
  res.io.emit('sdk:readme:call', { time: Date.now() });

  // If we're testing a case where the ReadMe API is down, the `apiKeyToSimReadmeBeingDown` API user is the way to do
  // that here.
  const apiKey = Buffer.from(req.header('authorization').split(' ')[1], 'base64').toString();
  if (apiKey === 'apiKeyToSimReadmeBeingDown:') {
    return res.status(401).json({
      message: "We couldn't find your API key",
    });
  }

  return res.json({
    baseUrl: baseLogUrl,
  });
});

app.post('/metrics-api/v1/request', async (req, res) => {
  res.io.emit('sdk:metrics:call', { time: Date.now() });

  const [sdkName, sdkVersion] = req.header('user-agent').split('/');

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

        // Since we're doing wildcard matches on our headers later, let's make sure that we at least have some headers
        // present.
        assert.ok(entry.request.headers.length > 0, 'Entry request headers is empty.');
        assert.ok(entry.response.headers.length > 1, 'Entry response headers should have more than one entry.');

        // Ensure that our payload response headers contains the `x-documentation-url` and that it contains the same UUID.
        const docsHeader = entry.response.headers.find(header => header.name === 'x-documentation-url');
        if (payload.group.id === 'no-log-url') {
          assert.ok(
            docsHeader === undefined,
            "A `x-documentation-url` header was present when it shouldn't have been."
          );
        } else {
          assert.ok(docsHeader, 'No `x-documentation-url` header could be located in the entry response headers');

          assert.strictEqual(
            docsHeader.value,
            `${baseLogUrl}/logs/${uuid}`,
            '`x-documentation-url` header is not what is expected.'
          );
        }

        // Since our fake environment creates variable ports, we need to ensure that our pagerefs and URLs in the payload
        // are valid URLs.
        assert.strictEqual(new URL(entry.pageref).hostname, '127.0.0.1', 'Entry `pageref` should point to localhost.');
        assert.strictEqual(
          new URL(entry.request.url).hostname,
          '127.0.0.1',
          'Entry `request.url` should point to localhost.'
        );
      })
    );

    const fixture = harFixtures[req.body[0].group.id];
    let expected;
    let end;
    if (req.body[0].group.id === 'buffered-requests') {
      // If we're testing buffered payloads, let's split our fixture up into chunks based on which buffered positon
      // we're currently processing. Also emit a signal back to the open socket informing the SDK test that we've
      // handled this instance of its buffered/staggered payload.
      end = bufferedSet * 5;
      expected = fixture.slice(end - 5, end);

      res.io.emit('sdk:metrics:buffer', {
        position: bufferedSet,
      });

      if (bufferedSet < 4) {
        bufferedSet += 1;
      } else {
        // Since this server runs for all tests, reset our buffered position back to the start once we've exhausted our
        // four slices so other tests that run after this that test buffering will work.
        bufferedSet = 1;
      }

      // Add a bit of latency into this call so the SDK that's buffering requests can expect some real-world latency
      // between its buffered calls.
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      expected = fixture;
    }

    // Update our test fixture to allow us to dynamically do assertions on dates, times, and variable headers coming
    // from our different SDK test servers. We need to use `expect` instead of `assert` for this assertion because the
    // expect module allow us to dynamic matching on deep objects with `expect.any()`.
    expected.forEach((ex, i) => {
      expected[i]._id = expect.any(String);

      expected[i].request.log.creator.comment = expect.any(String);
      expected[i].request.log.creator.name = sdkName;
      expected[i].request.log.creator.version = sdkVersion;

      expected[i].request.log.entries.forEach((ent, ii) => {
        expected[i].request.log.entries[ii].pageref = expect.any(String);
        expected[i].request.log.entries[ii].request.headers = expect.any(Array);
        expected[i].request.log.entries[ii].request.url = expect.any(String);
        expected[i].request.log.entries[ii].response.headers = expect.any(Array);
        expected[i].request.log.entries[ii].startedDateTime = expect.any(String);
        expected[i].request.log.entries[ii].time = expect.any(Number);
      });
    });

    try {
      await expect(req.body).toStrictEqual(expected);
    } catch (err) {
      if (err.matcherResult && err.matcherResult.name !== 'toStrictEqual') {
        throw err;
      }

      throw new AssertionError({
        message: 'Payload does not line up with the test fixture.',
        actual: err.message,
      });
    }
  } catch (err) {
    if (!(err instanceof AssertionError)) {
      throw err;
    }

    res.io.emit('sdk:metrics:assertion', { success: false, reason: err.message, error: err });
    return res.sendStatus(200);
  }

  res.io.emit('sdk:metrics:assertion', { success: true });
  return res.sendStatus(200);
});

app.all('*', (req, res) => {
  return res.status(404).json({
    error: `Unknown or unmocked test runner endpoint accessed: ${req.path}`,
  });
});

server.listen(port);
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

  console.log(`🏄 Server is listening on ${bind}`);
});
