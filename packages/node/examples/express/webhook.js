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

app.post('/webhook', express.json({ type: 'application/json' }), (req, res) => {
  // Verify the request is legitimate and came from ReadMe
  const signature = req.headers['readme-signature'];
  // Your ReadMe secret
  const secret = process.env.README_API_KEY;
  try {
    readme.verifyWebhook(req.body, signature, secret);
  } catch (e) {
    // Handle invalid requests
    return res.sendStatus(401);
  }
  // Fetch the user from the db
  // eslint-disable-next-line @typescript-eslint/no-use-before-define, @typescript-eslint/no-unused-vars
  return db.find({ email: req.body.email }).then(user => {
    return res.json({
      // OAS Security variables
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' },
    });
  });
});

const server = app.listen(port, 'localhost', function () {
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', server.address().address, port);
});

class db {
  static find() {
    return Promise.resolve({});
  }
}
