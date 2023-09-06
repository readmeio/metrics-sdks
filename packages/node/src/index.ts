import type { GetProjectResponse200 } from './.api/apis/developers';
import type { Options } from './lib/log';
import type { NextFunction, Request, Response } from 'express';

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

interface GetUserParams {
  byAPIKey: (apiKey: string) => unknown;
  byEmail: (email: string) => unknown;
  manualAPIKey?: string;
}

interface GetUserFunction {
  (params: GetUserParams): unknown;
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

const guessWhereAPIKeyIs = (req: Request): string => {
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
    return req.headers[apiKeyHeader] as string;
  }

  // Is it a cookie?
  // Ok idk what to do for this case yet

  // Is it a query param?
  if (req.query.api_key) {
    return req.query.api_key as string;
  } else if (req.query.apiKey) {
    return req.query.apiKey as string;
  }

  // error case where we tell them to go the manual route
  throw new Error('test');
};

// See comment at the auth definition below
let requestAPIKey = '';
let readmeAPIKey = '';
let readmeProjectData: GetProjectResponse200 | undefined;

const readme = (
  userFunction: (req: Request, getUser: GetUserFunction) => GroupingObject & Options,
  { disableWebhook, disableMetrics } = {
    disableWebhook: false,
    disableMetrics: false,
  }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const getUser = ({ byAPIKey, byEmail, manualAPIKey }: GetUserParams): unknown => {
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
      try {
        requestAPIKey = guessWhereAPIKeyIs(req);
      } catch (e) {
        console.error(e);
      }
      return byAPIKey(requestAPIKey);
    };

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

    // Really want to make sure we only show setup on development
    // not sure how reliable node_env is
    const isDevelopment =
      env === 'development' || baseUrl.includes('localhost') || baseUrl.includes('.local') || baseUrl.includes('.dev');

    if (!readmeProjectData) {
      readmeSdk.auth(readmeAPIKey);
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

      const user = await userFunction(req, getUser);

      if (!user || (typeof user === 'object' && !Object.keys(user).length)) return res.json({});

      const { grouping } = splitIntoUserAndConfig(user);
      return res.send(grouping);
    } else if (req.path === '/readme-setup' && isDevelopment) {
      const setupHtml = buildSetupView({
        baseUrl,
        subdomain: readmeProjectData.subdomain as string,
        readmeAPIKey,
        disableMetrics,
        disableWebhook,
      });
      return res.send(setupHtml);
    } else if (req.path === '/webhook-test' && isDevelopment) {
      const email = req.query.email as string;
      const webhookData = await testVerifyWebhook(baseUrl, email, readmeProjectData.jwtSecret as string);
      return res.json({ ...webhookData });
    }

    const user = await userFunction(req, getUser);
    if (!user || !Object.keys(user).length || disableMetrics) return next();

    const { grouping, config } = splitIntoUserAndConfig(user);
    const filteredKey = grouping.keys.find(key => key.apiKey === requestAPIKey);

    if (!filteredKey || !filteredKey.apiKey) {
      console.error(`API key ${requestAPIKey} not found`);
      return next();
    }

    log(readmeAPIKey, req, res, { apiKey: filteredKey.apiKey, label: filteredKey.name, email: grouping.email }, config);
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
  readmeAPIKey = key;
  // Reset the cache for the ReadMe project if the api key changes
  readmeProjectData = undefined;
  return readme;
}

export { verifyWebhook, log, auth, getProjectBaseUrl, readme };
