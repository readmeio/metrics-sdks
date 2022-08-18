import express from 'express';
import readme from 'readmeio';

const app = express();

// Your ReadMe secret
const secret = 'my-readme-secret';

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
    api_key: 'default-api_key-key',
    http_basic: { user: 'user', pass: 'pass' },
    http_bearer: 'default-http_bearer-key',
    oauth2: 'default-oauth2-key',
  });
});

app.listen(4000);