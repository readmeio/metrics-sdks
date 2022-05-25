import Hapi from '@hapi/hapi';
import readmeio from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable');
  process.exit(1);
}

const port = process.env.PORT || 4000;

const init = async () => {
  const server = Hapi.server({ host: 'localhost', port });

  server.ext('onPostResponse', function (request, h) {
    const { response, raw, info } = request;
    const { req, res } = raw;

    const payloadData = {
      // User's API Key
      apiKey: 'owlbert-api-key',
      // Username to show in the dashboard
      label: 'Owlbert',
      // User's email address
      email: 'owlbert@example.com',
      startedDateTime: new Date(info?.received),
      responseEndDateTime: new Date(info?.responded),
      responseBody: response?.source,
    };

    readmeio.log(process.env.README_API_KEY, req, res, payloadData, { fireAndForget: true });

    return h.continue;
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return { message: 'hello world' };
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
