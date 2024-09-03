import type { Options } from './log';
import type { NextFunction, Request, Response } from 'express';

import pkg from '../../package.json';
import config from '../config';

import findAPIKey from './find-api-key';
import { getGroupByApiKey } from './get-group-id';
import { log } from './log';
import { logger } from './logger';
import { buildSetupView } from './setup-readme-view';
import { testVerifyWebhook } from './test-verify-webhook';
import verifyWebhook from './verify-webhook';

interface BasicAuthObject {
  pass: string;
  user: string;
}

export interface ApiKey {
  [x: string]: unknown;

  apiKey?: BasicAuthObject | string;
  id?: string;
  label?: string;
  name?: string;
}

export type KeyValue = Record<string, string> | string;

export interface GroupingObject {
  [x: string]: ApiKey[] | KeyValue | string | undefined;

  apiKey?: string;
  email: string;
  id?: string;
  keys: ApiKey[];
  label?: string;
  name: string;
}

// Typing the return as unknown to make it easier to format the user to our format in the middleware
// This way these functions can just return from their database
interface GetUserParams {
  byAPIKey: (apiKey: string) => Promise<GroupingObject | undefined | void> | undefined;
  byEmail: (email: string) => Promise<GroupingObject | undefined | void> | undefined;
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

  private readmeProjectData!: {
    [x: string]: unknown;
    baseUrl?: string;
    jwtSecret?: string;
    name?: string;
    plan?: string;
    subdomain?: string;
  };

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
          logger.error({
            message:
              'Missing required definition for `byAPIKey`. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
          });
          return next();
        }
        if (!byEmail && !options.disableWebhook) {
          logger.error({
            message:
              'Missing required definition for `byEmail`. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
          });
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
        } catch (err) {
          logger.error({
            err,
            message:
              'Could not automatically find an API key in the request. You should pass the API key via `manualAPIKey` in the `getUser` function. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#getuserbyapikey',
          });
        }
        return byAPIKey(requestAPIKey);
      };

      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

      if (!this.readmeProjectData) {
        try {
          const encodedApiKey = Buffer.from(`${this.readmeAPIKey}:`).toString('base64');
          const { origin: readmeAPIOrigin } = new URL(config.readmeApiUrl);
          const headers = {
            authorization: encodedApiKey,
            'user-agent': `${pkg.name}/${pkg.version}`,
          };

          this.readmeProjectData = await fetch(new URL('/api/v1/', readmeAPIOrigin), {
            headers,
          }).then(r => r.json() as Promise<typeof this.readmeProjectData>);

          this.readmeVersionData = await fetch(new URL('/api/v1/version', readmeAPIOrigin), {
            headers,
          }).then(r => r.json() as Promise<ReadMeVersion[]>);
        } catch (err) {
          // TODO: Maybe send this to sentry?
          if (err.status === 401) {
            logger.error({ err, message: 'Invalid ReadMe API key. Contact support@readme.io for help!' });
          } else {
            logger.error({ err, message: 'Error calling ReadMe API. Contact support@readme.io for help!' });
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
        } catch (err) {
          logger.error({ err, message: 'Verify webhook error' });
          return res.status(400).json({ error: (err as Error).message });
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
        } catch (err) {
          logger.error({ err, message: 'Webhook verification failed.' });
          return res.status(400).json({ error: (err as Error).message });
        }
      }

      try {
        const user = await userFunction(req, getUser);
        if (!user || !Object.keys(user).length || options.disableMetrics) return next();

        const group = getGroupByApiKey(user, requestAPIKey);
        if (!group) {
          logger.error({
            message: usingManualAPIKey
              ? 'The API key you passed in via `manualAPIKey` could not be found in the user object you provided.'
              : 'Could not automatically find an API key in the request. You should pass the API key via `manualAPIKey` in the `getUser` function. Learn more here: https://docs.readme.com/main/docs/unified-snippet-docs#/getuserbyapikey',
          });
          return next();
        }

        log(
          this.readmeAPIKey,
          req,
          res,
          {
            apiKey: group.id,
            label: group.label,
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
