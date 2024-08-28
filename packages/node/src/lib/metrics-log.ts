import type { Options } from './log';
import type { Har } from 'har-format';
import type { UUID } from 'node:crypto';

import timeoutSignal from 'timeout-signal';

import pkg from '../../package.json';
import config from '../config';

import { logger } from './logger';

export interface GroupingObject {
  /**
   * API Key used to make the request. Note that this is different from the `readmeAPIKey`
   * described above and should be a value from your API that is unique to each of your users.
   */
  apiKey: string;

  /**
   * Email of the user that is making the call.
   */
  email?: string;

  /**
   * @deprecated use `apiKey` instead
   */
  id?: string;

  /**
   * This will be the user's display name in the API Metrics Dashboard, since it's much easier to
   * remember a name than an API key.
   */
  label?: string;
}

export interface OutgoingLogBody {
  _id?: UUID;
  _version: number;
  clientIPAddress: string;
  development: boolean;
  // API Key is currently a mapping to ID. Eventually we will support this server side. The omit and readdition of ID is to remove the deprecated warning in the meanwhile
  group: Omit<GroupingObject, 'apiKey' | 'id'> & { id: string };
  request: Har;
}

type LogId = UUID | UUID[] | undefined;

export interface LogResponse {
  ids: LogId;
  response?: Response;
}

const BACKOFF_SECONDS = 15; // when we need to backoff HTTP requests, pause for seconds

let backoffExpiresAt: Date | undefined;

// Exported for use in unit tests
export function setBackoff(expiresAt: Date | undefined) {
  backoffExpiresAt = expiresAt;
}

function shouldBackoff(response: Response) {
  // Some HTTP error codes indicate a problem with the API key, like the key is
  // invalid or it's being rate limited. To avoid pointless requests to the
  // ReadMe server, pause outgoing requests for a few seconds before trying
  // again. Logs will be silently discarded while requests are paused, which is
  // acceptable since the server wouldn't accept them anyway.
  switch (response.status) {
    case 401: // Unauthorized, i.e. this API key is invalid
      return true;
    case 403: // Forbidden, i.e. this API key is blocked by the server
      return true;
    case 429: // Too Many Requests, i.e. this API key is currently being rate limited
      return true;
    case 500: // Internal Server Error; give the ReadMe server a chance to recover
      return true;
    case 503: // Service Unavailable; same thing
      return true;
    default:
      return false;
  }
}

function getLogIds(body: OutgoingLogBody | OutgoingLogBody[]): LogId {
  if (Array.isArray(body)) {
    return body.map(value => value._id) as UUID[];
  }

  return body._id;
}

export function metricsAPICall(readmeAPIKey: string, body: OutgoingLogBody[], options: Options): Promise<LogResponse> {
  const signal = timeoutSignal(config.timeout);
  const encodedKey = Buffer.from(`${readmeAPIKey}:`).toString('base64');

  const makeRequest = () => {
    if (backoffExpiresAt) {
      if (backoffExpiresAt > new Date()) {
        return Promise.resolve(undefined);
      }
      // after the backoff expires, erase the old expiration time
      backoffExpiresAt = undefined;
    }
    logger.verbose({ message: 'Making a POST request to a service...', args: { body } });
    return fetch(new URL('/v1/request', config.host), {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      signal,
    })
      .then(response => {
        if (shouldBackoff(response)) {
          // backoff for a few seconds, but not if another callback has already started backing off
          if (!backoffExpiresAt) {
            backoffExpiresAt = new Date();
            backoffExpiresAt.setSeconds(backoffExpiresAt.getSeconds() + BACKOFF_SECONDS);
          }
        }
        const logLevel = response.ok ? 'info' : 'error';
        logger[logLevel]({ message: `Service responded with status ${response.status}: ${response.statusText}.` });
        return response;
      })
      .finally(() => {
        timeoutSignal.clear(signal);
      });
  };

  if (options.fireAndForget) {
    makeRequest();
    return Promise.resolve<LogResponse>({
      ids: getLogIds(body),
    });
  }

  return makeRequest().then(response => {
    return {
      response,
      ids: getLogIds(body),
    };
  });
}
