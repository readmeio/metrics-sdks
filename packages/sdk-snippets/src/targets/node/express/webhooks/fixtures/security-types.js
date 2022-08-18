import express from 'express';
import readme from 'readmeio';

const app = express();

app.post('/webhook', express.json({ type: 'application/json' }), (req, res) => {
  // Verify the request is legitimate and came from ReadMe
  const signature = req.headers['readme-signature'];
  // Your ReadMe secret
  const secret = process.env.README_API_KEY;
  try {
    readme.verifyWebhook(req.body, signature, secret);
  } catch (e) {
    // Handle invalid requests
    return res.status(401).json({ error: e.message });
  }
  // Fetch the user from the db
  return db.find({ email: req.body.email }).then(user => {
    return res.json({
      // OAS Security variables
      api_key: 'default-api_key-key',
      http_basic: { user: 'user', pass: 'pass' },
      http_bearer: 'default-http_bearer-key',
      oauth2: 'default-oauth2-key',
    });
  });
});

app.listen(4000);
