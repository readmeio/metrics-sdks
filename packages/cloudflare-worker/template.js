const readme = require('@readme/cloudflare-worker');

addEventListener('fetch', event => {
  event.passThroughOnException();
  event.respondWith(respond(event));
});

async function respond(event) {
  const { response, har } = await readme.fetchAndCollect(event.request);

  event.waitUntil(readme.metrics('API_KEY', {
    id: 'cloudflare-worker-test',
    label: 'cloudflare'
  }, event.request, har))

  return response;
}
