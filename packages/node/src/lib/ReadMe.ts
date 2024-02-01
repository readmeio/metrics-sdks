import type { Options } from './log';
import type { GetProjectResponse200 } from '../.api/apis/developers';
import type { NextFunction, Request, Response } from 'express';

import readmeSdk from '../.api/apis/developers';

import findAPIKey from './find-api-key';
import { getGroupIdByApiKey } from './get-group-id';
import { log } from './log';
import { buildSetupView } from './setup-readme-view';
import { testVerifyWebhook } from './test-verify-webhook';
import verifyWebhook from './verify-webhook';

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

interface ReadMeVersion {
  is_stable: boolean;
  version: string;
}

/**
 * Initialize this class with the API Key for your ReadMe project and use the `express` method
 * to return middleware that will send supplied API requests to ReadMe Metrics and configure the ReadMe webhook.
 *
 * @see {@link https://readme.com/metrics}
 * @see {@link https://docs.readme.com/main/docs/unified-snippet-docs}
 */
export default class ReadMe {
  private readmeAPIKey: string;

  private readmeProjectData!: GetProjectResponse200;

  private readmeVersionData!: ReadMeVersion[];

  /**
   * @param key The API key for your ReadMe project. This ensures your requests end up in
   * your dashboard. You can read more about the API key in
   * [our docs](https://docs.readme.com/reference/authentication).
   */
  constructor(key: string) {
    this.readmeAPIKey = key;
  }

  /**
   * Express middleware that will send supplied API requests to ReadMe Metrics and will create a new endpoint for the ReadMe webhook.
   */
  express(
    userFunction: (req: Request, getUser: GetUserFunction) => Promise<GroupingObject | void>,
    options: Options = {
      disableWebhook: false,
      disableMetrics: false,
      development: false,
    },
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      let requestAPIKey = '';
      let usingManualAPIKey = false;

      const getUser: GetUserFunction = async ({ byAPIKey, byEmail, manualAPIKey }) => {
        if (!byAPIKey && !options.disableMetrics) {
          console.error(
            'Missing required definition for `byAPIKey`. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
          );
          return next();
        }
        if (!byEmail && !options.disableWebhook) {
          console.error(
            'Missing required definition for `byEmail`. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
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
            'Could not automatically find an API key in the request. You should pass the API key via `manualAPIKey` in the `getUser` function. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
          );
        }
        return byAPIKey(requestAPIKey);
      };

      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

      if (!this.readmeProjectData) {
        readmeSdk.auth(this.readmeAPIKey);
        try {
          this.readmeProjectData = (await readmeSdk.getProject()).data;
          this.readmeVersionData = (await readmeSdk.getVersions()).data as ReadMeVersion[];
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
          verifyWebhook(
            req.body,
            req.headers['readme-signature'] as string,
            this.readmeProjectData.jwtSecret as string,
          );
          const user = await userFunction(req, getUser);
          return res.send(user);
        } catch (e) {
          return res.status(400).json({ error: (e as Error).message });
        }
      } else if (req.path === '/readme-setup' && options.development) {
        const setupHtml = buildSetupView({
          baseUrl,
          subdomain: this.readmeProjectData.subdomain as string,
          stableVersion: this.readmeVersionData?.find(version => version.is_stable)?.version || '1.0',
          readmeAPIKey: this.readmeAPIKey,
          disableMetrics: options.disableMetrics,
          disableWebhook: options.disableWebhook,
        });
        return res.send(setupHtml);
      } else if (req.path === '/webhook-test' && options.development) {
        const email = req.query.email as string;
        try {
          const webhookData = await testVerifyWebhook(baseUrl, email, this.readmeProjectData.jwtSecret as string);
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
              : 'Could not automatically find an API key in the request. You should pass the API key via `manualAPIKey` in the `getUser` function. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#/getuserbyapikey',
          );
          return next();
        }

        log(
          this.readmeAPIKey,
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
  }
}
