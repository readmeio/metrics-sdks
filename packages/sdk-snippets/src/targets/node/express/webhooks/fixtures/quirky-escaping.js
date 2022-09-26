const express = require('express');
const readme = require('readmeio');

const app = express();

// Your ReadMe secret
const secret = 'my-readme-secret';

app.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  // Verify the request is legitimate and came from ReadMe.
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
    // OAS Server variables
    '2name': 'default-name',
    '*port': '',
    'p*o?r*t': '',
    normal_server_var: '',

    // OAS Security variables
    '"petstore" auth': 'default "key"\\',
    'basic-auth': { user: 'user', pass: 'pass' },
    normal_security_var: { user: 'user', pass: 'pass' },
  });
});

const server = app.listen(8000, '0.0.0.0', function () {
  console.log('Example app listening at http://%s:%s', server.address().address, server.address().port);
});
