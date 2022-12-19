const {
  APIGatewayClient,
  CreateApiKeyCommand,
  CreateUsagePlanKeyCommand,
  GetApiKeysCommand,
} = require('@aws-sdk/client-api-gateway');
const readme = require('readmeio');

// Your ReadMe secret; you may want to store this in AWS Secrets Manager
const README_SECRET = 'my-readme-secret';

// Your default API Gateway usage plan; this will be attached to new API keys being created
const DEFAULT_USAGE_PLAN_ID = '123abc';

exports.handler = async event => {
  let statusCode, email, apiKey, error;

  try {
    // Verify the request is legitimate and came from ReadMe.
    const signature = event.headers['ReadMe-Signature'];
    const body = JSON.parse(event.body);
    readme.verifyWebhook(body, signature, README_SECRET);

    // Look up the API key associated with the user's email address.
    const email = body.email;
    const client = new APIGatewayClient();
    const getCommand = new GetApiKeysCommand({ nameQuery: email, includeValues: true });
    const keys = await client.send(getCommand);
    if (keys.items.length > 0) {
      // If multiple API keys are returned for the given email, use the first one.
      apiKey = keys.items[0].value;
      statusCode = 200;
    } else {
      // If no API keys were found, create a new key and apply a usage plan.
      const createKeyCommand = new CreateApiKeyCommand({
        name: email,
        description: `API key for ReadMe user ${email}`,
        tags: {
          user: email,
          vendor: 'ReadMe',
        },
        enabled: true,
      });
      const key = await client.send(createKeyCommand);

      const usagePlanKeyCommand = new CreateUsagePlanKeyCommand({
        usagePlanId: DEFAULT_USAGE_PLAN_ID,
        keyId: key.id,
        keyType: 'API_KEY',
      });
      await client.send(usagePlanKeyCommand);

      apiKey = key.value;
      statusCode = 200;
    }
  } catch (e) {
    error = e.message;
    statusCode = error.match(/Signature/) ? 401 : 500;
  }

  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // OAS Server variables
      name: 'default-name',
      port: '',

      // OAS Security variables
      petstore_auth: apiKey,
      basic_auth: { user: email, pass: apiKey },

      // Error message, if any
      message: error,
    }),
  };
};