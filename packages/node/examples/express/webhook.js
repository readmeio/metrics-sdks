#!/usr/bin/env node
import express from 'express';
import readme from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 4000;

// Your ReadMe secret
const secret = process.env.README_API_KEY;

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

const server = app.listen(port, 'localhost', function () {
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', server.address().address, port);
});
