import type { LoggerStrategy } from './logger';
import type { UUID } from 'node:crypto';

export interface LogOptions {
  /**
   * An array of values to include in the incoming and outgoing headers, parameters and body;
   * everything else will be redacted.
   *
   * If set, the denylist will be ignored.
   */
  allowlist?: string[];

  /**
   * @deprecated use `denylist` instead
   */
  blacklist?: string[];

  /**
   * An array of values to redact from the incoming and outgoing headers, parameters and body.
   */
  denylist?: string[];

  /**
   * If true, the logs will be marked as development logs.
   */
  development?: boolean;

  /**
   * If true, this will return the log details without waiting for a response from the Metrics
   * servers.
   */
  fireAndForget?: boolean;

  /**
   * If true, the errors and other logs will be displayed in console. Your own logger strategy can be passed.
   */
  logger?: LoggerStrategy | boolean;

  /**
   * @deprecated use `allowList` instead
   */
  whitelist?: string[];
}

export interface PayloadData {
  /**
   * API Key used to make the request. Note that this is different from the `readmeAPIKey`
   * described above and should be a value from your API that is unique to each of your users.
   */
  apiKey: string;

  /**
   * Email of the user that is making the call
   */
  email?: string;

  /**
   * This will be the user's display name in the API Metrics Dashboard, since it's much easier to
   * remember a name than an API key.
   */
  label?: string;

  /**
   * A UUIDv4 identifier. If not provided this will be automatically generated for you. You can use
   * this ID in conjunction with your `base_url` to create the URL that points to this log.
   *
   * @example {base_url}/logs/{logId}
   */
  logId?: UUID;

  /**
   * Object or string | The incoming request body. You should provide this function a parsed object,
   * but a string is acceptable if necessary.
   */
  requestBody?: Record<string, unknown> | string;

  /**
   * The outgoing request body as a string.
   */
  responseBody?: string;

  /**
   * A JavaScript `Date` object representing the time the server finished sending the outgoing
   * response.
   */
  responseEndDateTime: Date;

  /**
   * If provided this path will be used instead of the request path. This is useful for grouping
   * common routes together as `/users/{user_id}` instead of each page being unique as `/users/1`,
   * `/users/2`, etc.
   */
  routePath?: string;

  /**
   * A JavaScript `Date` object representing the time the server received the incoming request.
   * This should be logged before retrieving and parsing the incoming request body.
   */
  startedDateTime: Date;
}

export interface Options extends LogOptions {
  baseLogUrl?: string;
  bufferLength?: number;
  disableMetrics?: boolean;
  disableWebhook?: boolean;
}
