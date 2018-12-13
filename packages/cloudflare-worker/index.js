/* eslint-env worker */
/* global HOST, VERSION */

async function getRequestBody(request) {
  if (request.method.match(/GET|HEAD/)) {
    return { req: request, body: null };
  }

  const body = await request.text();

  return {
    req: new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    }),
    body,
  };
}

async function getResponseBody(response) {
  const body = await response.text();

  return {
    res: new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }),
    body,
  };
}

// These variables are replaced when the worker is
// compiled via webpack using a DefinePlugin
// it has been done this way to reduce the worker bundle
// size and reduce the number of dependencies
//
// The catch blocks will only be triggered from within a node
// environment, which is only during unit testing

let version = 'node';
/* istanbul ignore next */
try {
  version = VERSION;
} catch (e) {} // eslint-disable-line no-empty
let host = 'http://localhost';
/* istanbul ignore next */
try {
  host = HOST;
} catch (e) {} // eslint-disable-line no-empty

function log(...args) {
  /* eslint-disable no-console */
  if (process.env.NODE_ENV !== 'testing') console.log(...args);
}

module.exports.fetchAndCollect = async function fetchAndCollect(request) {
  log(`Readme CloudFlare Worker v${version}`, 'https://github.com/readmeio/cloudflare-worker');
  const startedDateTime = new Date();

  const { req, body: requestBody } = await getRequestBody(request);

  const response = await fetch(req);
  const requiredHeaders = ['x-readme-id', 'x-readme-label'];

  const missingHeaders = requiredHeaders
    .map(header => {
      if (!response.headers.has(header)) return header;
      return false;
    })
    .filter(Boolean);

  if (missingHeaders.length)
    throw new Error(`Missing headers on the response: ${missingHeaders.join(', ')}`);

  const { res, body: responseBody } = await getResponseBody(response);

  const har = {
    log: {
      creator: { name: '@readme/cloudflare-worker', version },
      entries: [
        {
          startedDateTime: startedDateTime.toISOString(),
          time: new Date().getTime() - startedDateTime.getTime(),
          request: {
            method: req.method,
            url: req.url,
            // TODO get http version correctly?
            httpVersion: '1.1',
            headers: [...req.headers].map(([name, value]) => ({ name, value })),
            queryString: [...new URL(req.url).searchParams].map(([name, value]) => ({
              name,
              value,
            })),
            postData: {
              mimeType: req.headers.get('content-type') || 'application/json',
              text: requestBody,
            },
          },
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: [...res.headers]
              .map(([name, value]) => ({ name, value }))
              // Strip out x-readme-* headers
              .filter(header => requiredHeaders.indexOf(header.name) === -1),
            content: {
              text: responseBody,
              size: responseBody.length,
              mimeType: res.headers.get('content-type') || 'application/json',
            },
          },
        },
      ],
    },
  };

  return { har, response: res };
};

module.exports.metrics = function readme(apiKey, group, req, har) {
  return fetch(`${host}/v1/request`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${apiKey}:`)}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify([
      {
        group,
        clientIPAddress: req.headers.get('cf-connecting-ip') || '0.0.0.0',
        request: har,
      },
    ]),
  })
    .then(async response => {
      log('Response from readme', response);
      log(await response.text());
    })
    .catch(
      /* istanbul ignore next */ err => {
        if (process.env.NODE_ENV !== 'testing') console.error('Error saving log to readme', err);
        throw err;
      },
    );
};
