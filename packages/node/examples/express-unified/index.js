#!/usr/bin/env node
import express from 'express';
import readme from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 8000;

// Your ReadMe secret
const secret = process.env.README_API_KEY;

readme.auth(secret);

const users = [
  {
    email: '1@test.com',
    name: 'User 1',
    apiKeys: [
      {
        apiKey: '123',
        name: 'project 1',
      },
      {
        apiKey: '456',
        name: 'project 2',
      },
    ],
  },
  {
    email: '2@test.com',
    name: 'User 1',
    apiKeys: [
      {
        apiKey: '123',
        name: 'project 1',
      },
      {
        apiKey: '789',
        name: 'project 3',
      },
    ],
  },
];

const getUser = ({ apiKey, email }) => {
  if (apiKey) {
    return users.find(user => user.apiKeys.find(key => key.apiKey === apiKey));
  }
  return users.find(user => user.email === email);
};

app.use(
  readme(async req => {
    // You'll need a function that can look up a user by either email or api_key
    // const user = await getUser(req.readme.email || req.readme.api_key);
    const user = getUser({ email: req.body.email, apiKey: req.query.apiKey });

    return {
      email: user.email, // The user associated here
      keys: user.apiKeys,
      name: user.name,

      // There's a lot more options!
      // Check out https://docs.readme.com/docs/metrics-setup
    };
  })
);

app.get('/', (req, res) => {
  res.json({ message: 'hello world' });
});

app.post('/', express.json(), (req, res) => {
  res.status(200).send();
});

const server = app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', server.address().address, port);
});
