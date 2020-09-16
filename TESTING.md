![blueprints](https://user-images.githubusercontent.com/33762/93278711-48f04c80-f77a-11ea-904c-16fbe5f4cf56.png)

Our Metrics SDKs implement a bespoke unified testing framework that allows us to test core functionality cross-language.

* [How it works](#%EF%B8%8F-how-it-works)
* [Writing tests](#-writing-tests)
    * [Test cases](#test-cases)
    * [Socket events](#socket-events)
    * [Adding new test cases](#adding-new-test-cases)
    * [Caveats](#caveats)
* [Running tests](#%EF%B8%8F-running-tests)


## 🧙‍♂️ How it works

Our Unified SDK Testing Framework (USTF) is built on top of a slim [Express](https://expressjs.com/) and [Socket.IO](https://socket.io/) server that does a couple things:

* Intercepts responses for API calls to both ReadMe and ReadMe Metrics.
* Runs a slew of unit tests against the incoming payloads to assert that they're valid.
* Emits events to a socket when certain cases happen, like the ReadMe API being accessed, or a ReadMe Metrics payload being buffered.

The individual SDKs then have their own tests (written in their own language) that access this test server and listen on the socket for a handful of events. When these events are emitted, the SDK tests can then determine, according to the event, if the test was a success.

Since this test server is built to intercept all requests that an SDK will issue, you don't need to worry about mocking out any networking traffic or faux responses. Cool!

## ✍ Writing tests

In order to write these tests, there are a few things you need to be aware of:

* The test server, and socket, both run at http://localhost:3000.
* Instead of accessing https://dash.readme.io/api for the ReadMe API, you should hit http://localhost:3000/readme-api.
* Likewise, use http://localhost:3000/metrics-api instead of https://metrics.readme.io for all ReadMe Metrics requests.
* For an API key use `validApiKey`.
    * If you need to test that the **ReadMe API** is down, use `apiKeyToSimReadmeBeingDown`.
* For a base log URL for the `x-documentation-url` header, use https://docs.example.com

To inform the test server of the kind of test you're executing, you should place that data in the `group.id` data of the payload. Normally this would be an ID of a user accessing the API that's reporting metrics, but we can instead glob onto this for subterfuge. Neat!

### Test cases

The test cases that we have available are the following:

| Case | What it does |
| :--- | :--- |
| `standard` | A standard request that contain **no** end-user payload. |
| `no-log-url` | Same as `standard`, but there is no `x-documentation-url`. Use this in conjunction with the `apiKeyToSimReadmeBeingDown` API key to simulate the ReadMe API being down and not being able to access the base logging URL.
| `buffered-requests` | This test will simulate a batch of requests being buffered to the Metrics API. The total number of logs this handles is 20 over 4 requests. To test that the requests were buffered properly, listen to the `sdk:metrics:buffer` event.
| `payload-plaintext` | A request to Metrics that includes `"{"a":1,"b":2,"c":3}"` in its end-user payload, but with **no** `Content-Type` present.
| `payload-json` | A request to Metrics that includes the end-user payload of `{ a: 1, b: 2, c: 3 }`.

### Socket events

| Event | Description |
| :--- | :--- | :--- |
| `sdk:readme:call` | The ReadMe API was accessed. Data sent back with this is a `time` property that includes the timestamp of the request.
| `sdk:metrics:call` | The ReadMe Metrics API was accessed. Data sent back with this is a `time` property that includes the timestamp of the request. |
| `sdk:metrics:buffer` | A positional buffered Metrics payload was seen. Listen to this when testing the `buffered-requests` case. Data sent back with this is a `positional` integer that you can use to determine if one of the buffered batches was accessed. |
| `sdk:metrics:assertion` | Informs you if the test of your payload succeeded or failed. You can determine the state of the test by looking at the `success` boolean, and if that is false you'll have a `reason` with a succict message of the assertion and `error` that contains some more data on what failed (like a diff of two objects). |

### Adding new test cases

If a test case needs to be constructed, it should be constructed within the USTF so it can be tested across every SDK.

Adding a new test case is as easy as dropping in a full ReadMe Metrics HAR payload into `test/payloads`. Give it a verbose name, update `test/payloads/index.js`, this guide, and then restart the test server.

### Caveats

* Since these test cases need to run cross-language and cross-framework, we can't run assertions on request and response headers (other than `x-documentation-url` being present) as one framework might add an `x-powered-by` that another doesn't. Because of this we do wildcard assertions on a couple pieces of data in `request.log.entries.*` including but not limited to `request.headers` and `response.headers`. If you need to run specific assertions on those headers, either do it within the SDK test, or figure out a way to normalize it for every SDK
* Since the assertions coming back over the socket from the test server are coming from the Node `assert` module and Jest's `expect`, errors you receive might be a bit difficult to decode. We've done our best to try to normalize them into something that can be decipherd, but your mileage may vary.

## 🏃‍♀️ Running tests

Running tests across the board can be done with `make test`. When testing locally since you'll only want to run the tests of the SDK you're working on so you can run either `make start` or `npm start`. The latter will listen for changes to the server code, while the former will just run the server.

This will boot up the test server and then you can run your SDK tests as you normally would. When you're done, run `make stop` to clean everything up.
