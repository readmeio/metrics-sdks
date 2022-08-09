import Fastify from 'fastify';
import readmeio from 'readmeio';

const fastify = Fastify({
  logger: true,
});

fastify.decorateRequest('readmeStartTime', '');
fastify.addHook('onRequest', (request, reply, next) => {
  request.readmeStartTime = new Date();
  next();
});

fastify.addHook('onSend', (request, reply, payload, next) => {
  const payloadData = {
    // User's API Key
    apiKey: 'owlbert-api-key',
    // Username to show in the dashboard
    label: 'Owlbert',
    // User's email address
    email: 'owlbert@example.com',

    startedDateTime: new Date(request.readmeStartTime),
    responseEndDateTime: new Date(),
    responseBody: payload,
  };

  readmeio.log(process.env.README_API_KEY, request, reply, payloadData, { fireAndForget: true });
  next();
});

fastify.get('/', (request, reply) => {
  reply.send({ message: 'hello world' });
});

fastify.listen({ port: 3000 }, err => {
  if (err) throw err;
});
