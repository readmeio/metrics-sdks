const readme = require('@readme/cloudflare-worker');
const matchRouteWhitelist = require('./lib/cloudflare-routing.js');

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
    id: response.headers.get('x-readme-id'),
    label: response.headers.get('x-readme-label'),
  }, event.request, har));

  return response;
}
