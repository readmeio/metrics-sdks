const { APIGatewayClient, GetApiKeysCommand } = require('@aws-sdk/client-api-gateway');
const readme = require('readmeio');

// Your ReadMe secret; you may want to store this in AWS Secrets Manager
const README_SECRET = 'my-readme-secret';

exports.handler = async event => {
  let statusCode, apiKey, error;

  try {
    const signature = event.headers['ReadMe-Signature'];
    const body = JSON.parse(event.body);
    readme.verifyWebhook(body, signature, README_SECRET);

    const email = body.email;
    const client = new APIGatewayClient();
    const command = new GetApiKeysCommand({ nameQuery: email, includeValues: true });
    const keys = await client.send(command);
    if (keys.items.length > 0) {
      apiKey = keys.items[0].value;
      statusCode = 200;
    } else {
      error = 'Email not found';
      statusCode = 404;
    }
  } catch (e) {
    error = e.message;
    statusCode = error.match(/Signature/) ? 401 : 500;
  }

  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, message: error }),
  };
};