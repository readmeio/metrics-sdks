import Fastify from 'fastify';
import readmeio from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable');
  process.exit(1);
}

const fastify = Fastify({
  logger: true,
});
const port = process.env.PORT || 4000;

fastify.addHook('onSend', async (request, reply, payload) => {
  const { raw: req } = request;
  const { raw: res } = reply;
  const payloadData = {
    // User's API Key
    apiKey: 'owlbert-api-key',
    // Username to show in the dashboard
    label: 'Owlbert',
    // User's email address
    email: 'owlbert@example.com',
  };
  // We have to patch the req/res objects with the params required for the sdk
  req.body = request.body;
  Object.entries(reply.getHeaders()).forEach(([name, val]) => reply.raw.setHeader(name, val));
  readmeio.log(process.env.README_API_KEY, req, res, payloadData);
  return payload;
});

fastify.get('/', (request, reply) => {
  reply.send({ message: 'hello world' });
});

fastify.post('/', (request, reply) => {
  reply.code(200).send();
});

fastify.listen({ port }, err => {
  if (err) throw err;
});
