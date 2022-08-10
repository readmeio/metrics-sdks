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

fastify.decorateRequest('readmeStartTime', null);
fastify.decorateReply('payload', null);
fastify.addHook('onRequest', async request => {
  request.readmeStartTime = new Date();
});

fastify.addHook('onSend', async (request, reply, payload) => {
  // eslint-disable-next-line no-param-reassign
  reply.payload = payload;
});

fastify.addHook('onResponse', async (request, reply) => {
  const payloadData = {
    // User's API Key
    apiKey: 'owlbert-api-key',
    // Username to show in the dashboard
    label: 'Owlbert',
    // User's email address
    email: 'owlbert@example.com',

    startedDateTime: new Date(request.readmeStartTime),
    responseEndDateTime: new Date(),
    responseBody: reply.payload,
  };

  readmeio.log(process.env.README_API_KEY, request.raw, reply, payloadData, { fireAndForget: true });
});

fastify.get('/', (request, reply) => {
  reply.send({ message: 'hello world' });
});

fastify.listen({ port }, err => {
  if (err) throw err;
});
