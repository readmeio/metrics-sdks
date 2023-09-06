import type { LogOptions } from './lib/construct-payload';

import sdk from 'api';

import { getProjectBaseUrl } from './lib/get-project-base-url';
import { log } from './lib/log';
import { buildSetupView } from './lib/setup-readme-view';
import { testVerifyWebhook } from './lib/test-verify-webhook';
import verifyWebhook from './lib/verify-webhook';

const env = process.env.NODE_ENV || 'development';

const readmeSDK = sdk('@developers/v2.0#19j1xdalksmothi');

interface ApiKey {
  apiKey: string;
  name: string;
}

interface GroupingObject {
  apiKeys: ApiKey[];
  email: string;
}

interface SplitOptions {
  config: LogOptions;
  grouping: GroupingObject;
}

const splitIntoUserAndConfig = (inputObject: GroupingObject | LogOptions): SplitOptions => {
  const configKeys = ['allowOptions', 'denyList', 'baseLogUrl', 'bufferLength', 'fireAndForget', 'development'];
  const grouping = {};
  const config = {};
  Object.keys(inputObject).forEach(key => {
    if (configKeys.includes(key)) {
      config[key] = inputObject[key];
    } else {
      grouping[key] = inputObject[key];
    }
  });
  return { grouping: grouping as GroupingObject, config };
};

const guessWhereAPIKeyIs = req => {
  // Authorization header
  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  } else if (req.headers.authorization && req.headers.authorization.includes('Basic')) {
    const basicAuth = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
    // TODO: what other types of basic auth are there?
    // TWilio has a username and a password in their basic auth
    return basicAuth[0];
  }

  // Check other headers
  // iterate over req.headers and see if api_key is in the name
  const apiKeyHeader = Object.keys(req.headers).find(
    headerName =>
      headerName.toLowerCase().includes('api-key') ||
      headerName.toLowerCase().includes('api_key') ||
      headerName.toLowerCase().includes('apikey')
  );

  if (apiKeyHeader) {
    return req.headers[apiKeyHeader];
  }

  // Is it a cookie?
  // Ok idk what to do for this case yet

  // Is it a query param?
  if (req.query.api_key) {
    return req.query.api_key;
  } else if (req.query.apiKey) {
    return req.query.apiKey;
  }

  // error case where we tell them to go the manual route
  return null;
};

// See comment at the auth definition below
let apiKey = '';
let readmeProject;
let requestAPIKey;

const readme = (
  userFunction,
  { disableWebhook, disableMetrics } = {
    disableWebhook: false,
    disableMetrics: false,
  }
) => {
  return async (req, res, next) => {
    const getUser = ({ byAPIKey, byEmail, manualAPIKey }) => {
      if (req.path === '/readme-webhook' && req.method === 'POST' && !disableWebhook) {
        const user = byEmail(req.body.email);
        if (!user) {
          console.error(`User with email ${req.body.email} not found`);
          return {};
        }
        return user;
      }
      if (manualAPIKey) {
        // we should remember this for later
        requestAPIKey = manualAPIKey;
        return byAPIKey(manualAPIKey);
      }
      // Try to figure out where the api key is
      requestAPIKey = guessWhereAPIKeyIs(req);
      if (!requestAPIKey) {
        console.error(
          'Unable to find API key automatically. Please use the manual method by passing the api key in via `manualAPIKey` to getUser.'
        );
      }
      return byAPIKey(requestAPIKey);
    };

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

    // Really want to make sure we only show setup on development
    // not sure how reliable node_env is
    const isDevelopment =
      env === 'development' || baseUrl.includes('localhost') || baseUrl.includes('.local') || baseUrl.includes('.dev');

    if (!readmeProject) {
      readmeSDK.auth(apiKey);
      try {
        readmeProject = (await readmeSDK.getProject()).data;
      } catch (e) {
        // TODO: Maybe send this to sentry?
        if (e.status === 401) {
          console.error('Invalid ReadMe API key. Contact support@readme.io for help!');
          console.error(e.data);
        } else {
          console.error('Error calling ReadMe API. Contact support@readme.io for help!');
          console.error(e.data);
        }
        // Don't want to cause an error in their API
        return next();
      }
    }
    if (req.path === '/readme-webhook' && req.method === 'POST' && !disableWebhook) {
      try {
        verifyWebhook(req.body, req.headers['readme-signature'], readmeProject.jwtSecret);
      } catch (e) {
        return res.status(401).send(e.message);
      }
      const user = await userFunction(req, getUser);

      if (!user) return res.json({});

      const { grouping } = splitIntoUserAndConfig(user);
      return res.send(grouping);
    } else if (req.path === '/readme-setup' && isDevelopment) {
      const setupHtml = buildSetupView({
        baseUrl,
        subdomain: readmeProject.subdomain,
        apiKey,
        disableMetrics,
        disableWebhook,
      });
      return res.send(setupHtml);
    } else if (req.path === '/webhook-test' && isDevelopment) {
      const email = req.query.email;
      const webhookData = await testVerifyWebhook(baseUrl, email, readmeProject.jwtSecret);
      return res.json({ ...webhookData });
    }

    const user = await userFunction(req, getUser);
    if (!user || !Object.keys(user).length || disableMetrics) return next();

    const { grouping, config } = splitIntoUserAndConfig(user);
    const filteredKey = grouping.apiKeys.find(key => key.apiKey === requestAPIKey);

    log(apiKey, req, res, { apiKey: filteredKey.apiKey, label: filteredKey.name, email: grouping.email }, config);
    return next();
  };
};

// I think this pattern will allow us to support both of these:
// const readme = require('readmeio').auth('api-key');
//
// I don't like this as much but not sure how else we can do it
// import { readme } from 'readmeio';
// readme.auth('api-key');
function auth(key) {
  apiKey = key;
  // Reset the cache for the ReadMe project if the api key changes
  readmeProject = undefined;
  return readme;
}

export { verifyWebhook, log, auth, getProjectBaseUrl, readme };
