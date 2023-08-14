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
const allowlist = process.env.README_ALLOWLIST === "true" ? ['publicKey', 'public-header', 'x-header-2']: null;
const denylist = process.env.README_DENYLIST === "true" ? ['privateKey', 'private-header', 'x-header-1'] : null;

app.use((req, res, next) => {
  readme.log(
    process.env.README_API_KEY,
    req,
    res,
    {
      // User's API Key
      apiKey: 'owlbert-api-key',
      // Username to show in the dashboard
      label: 'Owlbert',
      // User's email address
      email: 'owlbert@example.com',
    },
    {
      denylist,
      allowlist
    }
  );

  return next();
});

app.get('/', (req, res) => {
  res.set('x-header-1', 'header-1');
  res.set('x-header-2', 'header-2');
  res.json({ message: 'hello world' });
});

app.post('/', express.json(), (req, res) => {
  res.set('x-header-1', 'header-1');
  res.set('x-header-2', 'header-2');
  res.status(200).send({
    privateKey: 'myPrivateValue',
    publicKey: 'myPublicValue',
  });
});

app.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  // Verify the request is legitimate and came from ReadMe
  const signature = req.headers['readme-signature'];

  try {
    readme.verifyWebhook(req.body, signature, secret);
  } catch (e) {
    // Handle invalid requests
    return res.status(401).json({ error: e.message });
  }

  // Fetch the user from the database and return their data for use with OpenAPI variables.
  // const user = await db.find({ email: req.body.email })
  return res.json({
    // OAS Security variables
    petstore_auth: 'default-key',
    basic_auth: { user: 'user', pass: 'pass' },
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', server.address().address, port);
});
