#!/usr/bin/env node

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
  readmeio.metrics(process.env.README_API_KEY, req => ({
    // User's API Key
    apiKey: 'owlbert-api-key',
    // Username to show in the dashboard
    label: 'Owlbert',
    // User's email address
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
