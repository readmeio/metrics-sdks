const readme = require('@readme/cloudflare-worker');
const matchRouteWhitelist = require('./lib/cloudflare-routing.js');
const { CONSTANTS } = require('./constants.js');

addEventListener('fetch', event => {
  event.passThroughOnException();

  if (matchRouteWhitelist(event.request.url)) {
    event.respondWith(respond(event));
  }  else {
    event.respondWith(fetch(event.request));
  }
});

async function respond(event) {
  const { response, har } = await readme.fetchAndCollect(event.request);

  event.waitUntil(readme.metrics(event.request.authentications.account.token.token, {
    id: response.headers.get(CONSTANTS.HEADERS.ID),
    email: response.headers.get(CONSTANTS.HEADERS.EMAIL),
    label: response.headers.get(CONSTANTS.HEADERS.LABEL),
  }, event.request, har));

  return response;
}
