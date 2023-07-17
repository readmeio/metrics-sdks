import type { LogOptions } from './lib/construct-payload';

import { getProjectBaseUrl } from './lib/get-project-base-url';
import { log } from './lib/log';
import verifyWebhook from './lib/verify-webhook';

const env = process.env.NODE_ENV || 'development';

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
const findApiKey = req => {
  const apiKey = req.query.apiKey;
  if (!apiKey) {
    throw new Error('No API key provided');
  }
  return { apiKey };
};

// See comment at the auth definition below
let apiKey = '';

const readme = userFunction => {
  // IDK if this is the best thing to do, but feels
  // like we should notify the user somehow this is happening
  if (env === 'development') {
    console.log('Adding ReadMe Webhook Url at /readme-webhook');
    console.log('View docs: https://docs.readme.com/guides/docs/webhooks');
  }
  return async (req, res, next) => {
    if (req.path === '/readme-webhook') {
      try {
        // TODO: This needs to use jwt secret right now, we should probably consolidate
        // We probably want a new header that is an array of possible signatures given all of their api keys?
        // then we can just loop through and verify each one and make sure one matches
        verifyWebhook(req.body, req.headers['x-readme-signature'], apiKey);
      } catch (e) {
        return res.status(401).send(e.message);
      }
      req.readme = { email: req.body.email };
      const user = await userFunction(req, res);
      const { grouping } = splitIntoUserAndConfig(user);
      return res.send(grouping);
    }

    req.readme = findApiKey(req);

    const user = await userFunction(req, res);
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
