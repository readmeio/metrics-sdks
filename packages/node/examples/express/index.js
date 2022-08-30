#!/usr/bin/env node
import express from 'express';
import readmeio from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 8000;

app.use((req, res, next) => {
  readmeio.log(process.env.README_API_KEY, req, res, {
    // User's API Key
    apiKey: 'owlbert-api-key',
    // Username to show in the dashboard
    label: 'Owlbert',
    // User's email address
    email: 'owlbert@example.com',
  });

  return next();
});

app.get('/', (req, res) => {
  res.json({ message: 'hello world' });
});

app.post('/', express.json(), (req, res) => {
  res.status(200).send();
});

const server = app.listen(port, 'localhost', function () {
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', server.address().address, port);
});
