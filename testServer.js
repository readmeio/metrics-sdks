/* eslint-disable prettier/prettier */
/* eslint-disable global-require */
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

const harFixtures = {
  standard: require('./fixtures/standard.har'),
};

const port = 3000;
// const socketPort = 3001;
const baseLogUrl = 'https://docs.example.com';
const apiKey = 'mockReadMeApiKey';
/* const group = {
  id: '5afa21b97011c63320226ef3',
  label: 'example user',
  email: 'user@example.com',
}; */

console.logx = obj => {
  console.log(require('util').inspect(obj, false, null, true /* enable colors */))
}

app.use(bodyParser.json({}));

app.use((req, res, next) => {
  // Make sure all requests are authorized.
  const auth = req.header('authorization');
  if (!auth) {
    return res.status(401).json({
      message: "You must pass in an API key",
      suggestion: "API keys can be passed in as the username part of basic auth. You can find a code snippet in our docs! You can get your API key in Configuration > API Key, or in the docs.",
      poem: [
        "A very little key",
        "Can open a heavy door",
        "So include your authentication",
        "To see what our API has in store!"
      ]
    });
  }

  // Make sure that all requests have a well-formated user agent.
  const userAgent = req.header('user-agent');
  if (!userAgent) {
    return res.status(400).json({
      message: 'No user agent was supplied in a request from the SDK.',
    })
  } else if (userAgent !== 'readmeio/4.0.0') {
    // @todo split the UA and make sure that the first part is recognized and that the latter is valid semver
    return res.status(400).json({
      message: `An improperly formatted user agent (${userAgent}) was supplied. SDK user agents must be in a \`sdkName/versionSemver\` scheme.`,
    })
  }

  return next();
})

io.on('connection', function(socket) {
  console.log('A user connected');

  // Send a message after a timeout of 4seconds
  /* setTimeout(function() {
     socket.send('Sent a message 4seconds after connection!');
  }, 4000); */

  // console.log(socket)

  // socket.emit('event', {msg:'abc1'});
  socket.emit('testResult', {msg:'abc1'});

  socket.on('disconnect', function () {
     console.log('A user disconnected');
  });

  // ReadMe API calls
  app.get('/readme-api/v1', (req, res) => {
    return res.json({
      baseUrl: baseLogUrl,
    });
  });

  // Metrics API calls
  app.post('/metrics-api/v1/request', (req, res) => {
    // io.sockets.emit('hello', {msg:'abc'});
    // io.sockets.emit('event', {msg:'abc'});

    // socket.emit('testResult', {msg:'abc1'});

    // console.logx(req.body)

    return res.sendStatus(200);
    // return res.status(400).json({ error: 'idk' });
  });

  app.all('*', (req, res) => {
    return res.status(404).json({
      error: 'Unknown test runner endpoint accessed. Hit `GET /readme-api/v1` or `POST /metrics-api/v1/request`.'
    });
  });
});

http.listen(port, function() {
  console.log(`Test server running at http://localhost:${port}`);
});

/**
 * Given a real payload from a call to the Metrics API, assert that it's valid against what we expect for a type of
 * test.
 *
 * @param {Object} payload
 * @param {String} fixtureName The testing framework HAR payload fixture for the type of test you're writing against.
 *    Supported fixtures can be found in the root `fixtures/` directory.
 */
/* async function toHaveValidPayload(actual, stubName) {
  const expected = harFixtures[stubName];
  const payload = actual;

  // Make sure that the payload structure is right.
  expect(payload).toStrictEqual({
    _id: expect.any(String),
    group: expect.any(Object),
    clientIPAddress: expect.any(String),
    request: expect.any(Object),
  });

  // Make sure that we have a valid UUID.
  const uuid = payload._id;
  expect(isValidUUIDV4(uuid)).toBe(true);

  // Assert that the data request we're packaging up is a valid HAR.
  payload.request.log.entries.forEach((entry, i) => {
    // We don't fill this data in the SDK but let's mock it out so that we have a HAR that validates.
    payload.request.log.entries[i].request.headersSize = -1;
    payload.request.log.entries[i].request.bodySize = -1;
    payload.request.log.entries[i].request.cookies = [];

    // We can't assert that the dates and times match each other, but can at least make sure that they're right.
    expect(
      Number.isNaN(Date.parse(payload.request.log.entries[i].startedDateTime)),
      `startedDateTime (${payload.request.log.entries[i].startedDateTime}) should be a date`
    ).toBe(false);

    expect(typeof payload.request.log.entries[i].time).toBe('number');

    // Ensure that our payload response headers contains the `x-documentation-url`.
    const docsHeader = entry.response.headers.find(header => header.name === 'x-documentation-url');

    console.logx(payload)

    expect(docsHeader).not.toBeUndefined();
    expect(docsHeader.value).toBe(`${baseLogUrl}/logs/${uuid}`);

    // Since our fake environment creates variable ports, we need to ensure that our pagerefs and URLs in the payload
    // are valid URLs.
    expect(new URL(entry.pageref).hostname).toBe('127.0.0.1');
    expect(new URL(entry.request.url).hostname).toBe('127.0.0.1');
  });

  await expect(payload.request).toBeAValidHAR();

  // Update our test fixture to contain the UUID we're working with, as well as allow dynamic matching on dates and
  // times.
  expected._id = uuid;
  expected.request.log.entries.forEach((entry, i) => {
    expected.request.log.entries[i].pageref = expect.any(String);
    expected.request.log.entries[i].request.headers = expect.any(Array);
    expected.request.log.entries[i].request.url = expect.any(String);
    expected.request.log.entries[i].response.headers = expect.any(Array);
    expected.request.log.entries[i].startedDateTime = expect.any(String);
    expected.request.log.entries[i].time = expect.any(Number);
  });

  // See if our payload matches what we're expecting it to!
  expect(payload).toStrictEqual(expected);
} */
