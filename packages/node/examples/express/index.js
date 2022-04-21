import express from 'express';
import readmeio from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 4000;

app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readmeio.expressMiddleware(process.env.README_API_KEY, req => ({
    apiKey: Math.random().toString(36).substring(2),
    label: 'Owlbert',
    email: 'owlbert@example.com',
  }))
);

app.get('/', (req, res) => {
  res.json({ message: 'hello world' });
});

const server = app.listen(port, 'localhost', function () {
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', server.address().address, port);
});
