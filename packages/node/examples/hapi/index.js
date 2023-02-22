import Hapi from '@hapi/hapi';
import readmeio from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable');
  process.exit(1);
}

const port = process.env.PORT || 8000;

const init = async () => {
  const server = Hapi.server({ host: '0.0.0.0', port });

  server.ext('onPreResponse', (request, h) => {
    const { req, res } = request.raw;

    const payloadData = {
      // User's API Key
      apiKey: 'owlbert-api-key',
      // Username to show in the dashboard
      label: 'Owlbert',
      // User's email address
      email: 'owlbert@example.com',
    };

    req.body = request.payload;
    readmeio.log(process.env.README_API_KEY, req, res, payloadData);

    return h.continue;
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return { message: 'hello world' };
    },
  });

  server.route({
    method: 'POST',
    path: '/',
    handler: (request, h) => {
      return h.response().code(200);
    },
  });

  await server.start();
  // eslint-disable-next-line no-console
  console.log('Server listening on %s', server.info.uri);
};

process.on('unhandledRejection', err => {
  // eslint-disable-next-line no-console
  console.log(err);
  process.exit(1);
});

init();
