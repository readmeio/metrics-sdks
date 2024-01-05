import type { GetProjectResponse200 } from './.api/apis/developers';
import type { Options } from './lib/log';
import type { NextFunction, Request, Response } from 'express';

import readmeSdk from './.api/apis/developers';
import findAPIKey from './lib/find-api-key';
import { getGroupIdByApiKey } from './lib/get-group-id';
import { getProjectBaseUrl } from './lib/get-project-base-url';
import { log } from './lib/log';
import { buildSetupView } from './lib/setup-readme-view';
import { testVerifyWebhook } from './lib/test-verify-webhook';
import verifyWebhook from './lib/verify-webhook';

const env = process.env.NODE_ENV || 'development';

interface BasicAuthObject {
  pass: string;
  user: string;
}

export interface ApiKey {
  [x: string]: unknown;

  apiKey?: string | BasicAuthObject;
  id?: string;
  name?: string;
  label?: string;
}

export type KeyValue = string | Record<string, string>;

export interface GroupingObject {
  [x: string]: KeyValue | string | undefined | ApiKey[];

  email: string;
  keys: ApiKey[];
  name: string;
  label?: string;
  id?: string;
  apiKey?: string;
}

// Typing the return as unknown to make it easier to format the user to our format in the middleware
// This way these functions can just return from their database
interface GetUserParams {
  byAPIKey: (apiKey: string) => Promise<GroupingObject | void>;
  byEmail: (email: string) => Promise<GroupingObject | void>;
  manualAPIKey?: string;
}

interface GetUserFunction {
  (params: GetUserParams): Promise<GroupingObject | void>;
}

// See comment at the auth definition below
let readmeAPIKey = '';
let readmeProjectData: GetProjectResponse200 | undefined;

const readme = (
  userFunction: (req: Request, getUser: GetUserFunction) => Promise<GroupingObject | void>,
  options: Options = {
    disableWebhook: false,
    disableMetrics: false,
  },
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let requestAPIKey = '';
    let usingManualAPIKey = false;

    const getUser: GetUserFunction = async ({ byAPIKey, byEmail, manualAPIKey }) => {
      if (!byAPIKey && !options.disableMetrics) {
        console.error(
          'Missing required definition for byAPIKey. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
        );
        return next();
      }
      if (!byEmail && !options.disableWebhook) {
        console.error(
          'Missing required definition for byEmail. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
        );
        return next();
      }

      if (req.path === '/readme-webhook' && req.method === 'POST' && !options.disableWebhook) {
        const user = await byEmail(req.body.email);
        if (!user) {
          throw new Error(`User with email ${req.body.email} not found`);
        }
        return user;
      }
      if (manualAPIKey) {
        // we should remember this for later
        requestAPIKey = manualAPIKey;
        usingManualAPIKey = true;
        return byAPIKey(manualAPIKey);
      }
      // Try to figure out where the api key is
      try {
        requestAPIKey = findAPIKey(req);
      } catch (e) {
        console.error(
          'Could not automatically find API key in the request. You should pass the API key via `manualAPIKey` in the getUser function. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
        );
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
    }

    if (req.path === '/readme-webhook' && req.method === 'POST' && !options.disableWebhook) {
      try {
        verifyWebhook(req.body, req.headers['readme-signature'] as string, readmeProjectData.jwtSecret as string);
        const user = await userFunction(req, getUser);
        return res.send(user);
      } catch (e) {
        return res.status(400).json({ error: (e as Error).message });
      }
    } else if (req.path === '/readme-setup' && isDevelopment) {
      const setupHtml = buildSetupView({
        baseUrl,
        subdomain: readmeProjectData.subdomain as string,
        readmeAPIKey,
        disableMetrics: options.disableMetrics,
        disableWebhook: options.disableWebhook,
      });
      return res.send(setupHtml);
    } else if (req.path === '/webhook-test' && isDevelopment) {
      const email = req.query.email as string;
      try {
        const webhookData = await testVerifyWebhook(baseUrl, email, readmeProjectData.jwtSecret as string);
        return res.json({ ...webhookData });
      } catch (e) {
        return res.status(400).json({ error: (e as Error).message });
      }
    }

    try {
      const user = await userFunction(req, getUser);
      if (!user || !Object.keys(user).length || options.disableMetrics) return next();

      const groupId = getGroupIdByApiKey(user, requestAPIKey);
      if (!groupId) {
        console.error(
          usingManualAPIKey
            ? 'The API key you passed in via `manualAPIKey` could not be found in the user object you provided.'
            : 'Could not automatically find API key in the request. You should pass the API key via `manualAPIKey` in the getUser function. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#/getuserbyapikey',
        );
        return next();
      }

      log(
        readmeAPIKey,
        req,
        res,
        {
          apiKey: groupId,
          label: user.label ? user.label : user.name,
          email: user.email,
        },
        options,
      );
    } catch (e) {
      return next();
    }
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
