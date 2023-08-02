import type { LogOptions } from './lib/construct-payload';

import sdk from 'api';
import flatted from 'flatted';

import { getProjectBaseUrl } from './lib/get-project-base-url';
import { log } from './lib/log';
import { buildSetupView } from './lib/setup-readme-view';
import { testMetrics } from './lib/test-metrics';
import { testVerifyWebhook } from './lib/test-verify-webhook';
import verifyWebhook from './lib/verify-webhook';

const env = process.env.NODE_ENV || 'development';

const readmeSDK = sdk('@developers/v2.0#19j1xdalksmothi');

interface ApiKey {
  apiKey: string;
  name: string;
}

interface GroupingObject {
  email: string;
  keys: ApiKey[];
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

// Do we actually want to do it this way?
// A function to get the api key from the request could be error prone
// and we probably need a backup config option

// TODO:
// 1. Caching? This might be slow
// 2. Testing a bunch of cases for how api keys can be passed in

// What if we do this work in the metrics backend?
const findApiKey = (req, keys: [ApiKey]) => {
  const requestString = flatted.stringify(req);
  const key = keys.find(apiKey => {
    if (requestString.includes(apiKey.apiKey) || requestString.includes(btoa(`${apiKey.apiKey}:`))) {
      return true;
    }
    return false;
  });
  if (!key) {
    return { apiKey: undefined };
  }
  return { apiKey: key.apiKey };
};

// See comment at the auth definition below
let apiKey = '';

const readme = userFunction => {
  // IDK if this is the best thing to do, but feels
  // like we should notify the user somehow this is happening
  // TODO: this is confusing since the actual url depends on the path it's mounted on
  // TODO: is there a way to automatically open the page
  if (env === 'development') {
    console.log('Verify ReadMe is configured correctly /readme-setup');
  }
  return async (req, res, next) => {
    readmeSDK.auth(apiKey);
    let readmeProject;
    try {
      readmeProject = (await readmeSDK.getProject()).data;
    } catch (e) {
      // TODO: better way of handling this error
      console.log('Error fetching project, is your ReadMe API key correct');
      console.log(e);
    }
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    if (req.path === '/readme-webhook' && req.method === 'POST') {
      try {
        verifyWebhook(req.body, req.headers['readme-signature'], readmeProject.jwtSecret);
      } catch (e) {
        return res.status(401).send(e.message);
      }
      req.readme = { email: req.body.email };
      const user = await userFunction(req, res);

      if (!user) return res.json({});

      const { grouping } = splitIntoUserAndConfig(user);
      return res.send(grouping);
    } else if (req.path === '/readme-setup' && env === 'development') {
      const setupHtml = buildSetupView({ baseUrl });
      return res.send(setupHtml);
    } else if (req.path === '/webhook-test' && env === 'development') {
      const email = req.query.email;
      const webhookData = await testVerifyWebhook(baseUrl, email, readmeProject.jwtSecret);
      return res.json({ ...webhookData });
    } else if (req.path === '/metrics-test' && env === 'development') {
      // TODO: not implemented yet
      const metricsData = await testMetrics(apiKey);
      return res.json({ ...metricsData });
    }

    const user = await userFunction(req, res);
    if (!user || !Object.keys(user).length) return next();
    req.readme = findApiKey(req, user.keys);

    const { grouping, config } = splitIntoUserAndConfig(user);
    const filteredKey = grouping.keys.find(key => key.apiKey === req.readme.apiKey);

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
  return readme;
}

export { verifyWebhook, log, auth, getProjectBaseUrl, readme };
