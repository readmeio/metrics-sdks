// TODO
// - try using streaming for better efficiency
// - figure out the best way to get request mime type

const readme = require('readmeio/worker');

addEventListener('fetch', event => {
  event.passThroughOnException()
  event.respondWith(respond(event))
});

async function respond(event) {
  const { response, har } = await readme.fetchAndCollect(event.request);

  event.waitUntil(readme.metrics('API_KEY', {
    id: 'cloudflare-worker-test',
    label: 'cloudflare'
  }, event.request, har))

  return response;
}
