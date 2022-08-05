// Save this code as `server.js`
// Run the server with `node server.js`
const readme = require('readmeio');
const express = require('express');

const app = express();

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Verify the request is legitimate and came from ReadMe
  const signature = req.headers['readme-signature'];

  // Your ReadMe secret
  const secret = 'rdme_xxxx';

  try {
    readme.verify(req.body, signature, secret);
  } catch (e) {
    // Handle invalid requests
    return res.sendStatus(401);
  }

  // Fetch the user from the db
  db.find({ email: req.body.email }).then(user => {
    return res.json({
      // OAS Server variables
      name: 'default-name',
      port: 'port',

      // OAS Security variables
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' },
    });
  });
});