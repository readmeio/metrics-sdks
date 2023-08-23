import type { GetProjectResponse200 } from './.api/apis/developers';
import type { Options } from './lib/log';
import type { NextFunction, Request, Response } from 'express';

import flatted from 'flatted';

import readmeSdk from './.api/apis/developers';
import { getProjectBaseUrl } from './lib/get-project-base-url';
import { log } from './lib/log';
import { buildSetupView } from './lib/setup-readme-view';
import { testVerifyWebhook } from './lib/test-verify-webhook';
import verifyWebhook from './lib/verify-webhook';

const env = process.env.NODE_ENV || 'development';

interface ApiKey {
  [x: string]: unknown;
  apiKey?: string;
  name: string;
  pass?: string;
  user?: string;
}

interface GroupingObject {
  [x: string]: unknown;
  email: string;
  keys: ApiKey[];
  name: string;
}

interface SplitOptions {
  config: Options;
  grouping: GroupingObject;
}

const splitIntoUserAndConfig = (inputObject: GroupingObject & Options): SplitOptions => {
  const configKeys: (keyof Options)[] = [
    'allowlist',
    'denylist',
    'baseLogUrl',
    'bufferLength',
    'fireAndForget',
    'development',
  ];

  const grouping: GroupingObject = { email: '', keys: [], name: '' };
  const config: Options = {};
  Object.keys(inputObject).forEach(key => {
    const typedKey = key as keyof GroupingObject | keyof Options;
    if (configKeys.includes(typedKey as keyof Options)) {
      // @ts-expect-error Kanad TODO: look into if this works properly
      config[typedKey as keyof Options] = inputObject[typedKey];
    } else {
      grouping[typedKey] = inputObject[typedKey];
    }
  });
  return { grouping, config };
};

// Do we actually want to do it this way?
// A function to get the api key from the request could be error prone
// and we probably need a backup config option

// TODO:
// 1. Caching? This might be slow
// 2. Testing a bunch of cases for how api keys can be passed in

// What if we do this work in the metrics backend?
const findApiKey = (req: Request, keys: ApiKey[]) => {
  const requestString = flatted.stringify(req);
  const key = keys.find(apiKey => {
    if (
      (apiKey.apiKey && requestString.includes(apiKey.apiKey)) ||
      ((apiKey.user || apiKey.pass) && requestString.includes(btoa(`${apiKey.user || ''}:${apiKey.pass || ''}`)))
    ) {
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
let readmeProjectData: GetProjectResponse200 | undefined;

const readme = (
  userFunction: (req?: Request, res?: Response) => GroupingObject & Options,
  { disableWebhook, disableMetrics } = {
    disableWebhook: false,
    disableMetrics: false,
  },
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

    // Really want to make sure we only show setup on development
    // not sure how reliable node_env is
    const isDevelopment =
      env === 'development' || baseUrl.includes('localhost') || baseUrl.includes('.local') || baseUrl.includes('.dev');

    if (!readmeProjectData) {
      readmeSdk.auth(apiKey);
      try {
        readmeProjectData = (await readmeSdk.getProject()).data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
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
    } else if (req.path === '/readme-webhook' && req.method === 'POST' && !disableWebhook) {
      try {
        verifyWebhook(req.body, req.headers['readme-signature'] as string, readmeProjectData.jwtSecret as string);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        return res.status(401).send(e.message);
      }
      // Kanad TODO: this is brutal
      res.locals.readme = { email: req.body.email };
      const user = await userFunction(req, res);

      if (!user || (typeof user === 'object' && !Object.keys(user).length)) return res.json({});

      const { grouping } = splitIntoUserAndConfig(user);
      return res.send(grouping);
    } else if (req.path === '/readme-setup' && isDevelopment) {
      const setupHtml = buildSetupView({
        baseUrl,
        subdomain: readmeProjectData.subdomain as string,
        apiKey,
        disableMetrics,
        disableWebhook,
      });
      return res.send(setupHtml);
    } else if (req.path === '/webhook-test' && isDevelopment) {
      const email = req.query.email as string;
      const webhookData = await testVerifyWebhook(baseUrl, email, readmeProjectData.jwtSecret as string);
      return res.json({ ...webhookData });
    }

    const user = await userFunction(req, res);
    if (!user || !Object.keys(user).length || disableMetrics) return next();
    res.locals.readme = findApiKey(req, user.keys || []);

    const { grouping, config } = splitIntoUserAndConfig(user);
    const filteredKey =
      (grouping.keys?.length && grouping.keys.find(key => key.apiKey === res.locals.readme.apiKey)) || undefined;

    if (!filteredKey?.apiKey || !filteredKey?.name) return next();

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
function auth(key: string) {
  apiKey = key;
  // Reset the cache for the ReadMe project if the api key changes
  readmeProjectData = undefined;
  return readme;
}

export { verifyWebhook, log, auth, getProjectBaseUrl, readme };
