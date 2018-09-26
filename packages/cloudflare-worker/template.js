const readme = require('@readme/cloudflare-worker');

addEventListener('fetch', event => {
  event.passThroughOnException();

  const missingHeaders = ['x-readme-id', 'x-readme-label'].map((header) => {
    if (!event.request.headers.has(header)) return header;
    return false;
  }).filter(Boolean);

  if (missingHeaders.length) throw new Error(`Missing headers on the request: ${missingHeaders.join(', ')}`);

  event.respondWith(respond(event));
});

async function respond(event) {
  const { response, har } = await readme.fetchAndCollect(event.request);

  event.waitUntil(readme.metrics(API_KEY, {
    id: event.request.headers.get('x-readme-id'),
    label: event.request.headers.get('x-readme-label'),
  }, event.request, har));

  return response;
}
