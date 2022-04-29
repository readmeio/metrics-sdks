import type { Response } from 'node-fetch';
import type { PayloadData, LogOptions } from './construct-payload';
import type { ServerResponse, IncomingMessage } from 'http';
import type { Har } from 'har-format';
import fetch from 'node-fetch';
import timeoutSignal from 'timeout-signal';
import pkg from '../../package.json';
import config from '../config';
import { constructPayload } from './construct-payload';

export interface GroupingObject {
  /**
   * API Key used to make the request. Note that this is different from the `readmeAPIKey` described above and should be a value from your API that is unique to each of your users.
   */
  apiKey: string;
  /**
   * @deprecated use apiKey instead
   */
  id?: string;
  /**
   * This will be the user's display name in the API Metrics Dashboard, since it's much easier to remember a name than an API key.
   */
  label: string;
  /**
   * Email of the user that is making the call
   */
  email: string;
}

export interface OutgoingLogBody {
  _id?: string;
  clientIPAddress: string;
  development: boolean;
  // API Key is currently a mapping to ID. Eventually we will support this server side. The omit and readdition of ID is to remove the deprecated warning in the meanwhile
  group: Omit<GroupingObject, 'apiKey' | 'id'> & { id: string };
  request: Har;
}

export interface LogResponse {
  response?: Response;
  ids: string | string[];
}

function getLogIds(body: OutgoingLogBody | OutgoingLogBody[]): string | string[] {
  if (Array.isArray(body)) {
    return body.map(value => value._id);
  }

  return body._id;
}

export function metricsAPICall(
  readmeAPIKey: string,
  body: OutgoingLogBody[],
  fireAndForget = false
): Promise<LogResponse> {
  const signal = timeoutSignal(config.timeout);
  const encodedKey = Buffer.from(`${readmeAPIKey}:`).toString('base64');

  const makeRequest = () => {
    return fetch(new URL('/v1/request', config.host), {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
      signal,
    }).finally(() => {
      timeoutSignal.clear(signal);
    });
  };

  if (fireAndForget) {
    makeRequest();
    return Promise.resolve({
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

/**
 * Log a request to the API Metrics Dashboard with the standard Node.js server data.
 *
 * @param readmeAPIKey The API key for your ReadMe project. This ensures your requests end up in your dashboard. You can read more about the API key in [our docs](https://docs.readme.com/reference/authentication).
 * @param req A Node.js `IncomingMessage` object, usually found in your server's request handler.
 * @param res A Node.js `ServerResponse` object, usually found in your server's request handler.
 * @param payloadData A collection of information that will be logged alongside this request. See [Payload Data](#payload-data) for more details.
 * @param logOptions Additional options. Check the documentation for more details.
 *
 * @returns A promise that resolves to an object containing your log ids and the server response
 */
export function log(
  readmeAPIKey: string,
  req: IncomingMessage,
  res: ServerResponse,
  payloadData: PayloadData,
  logOptions: LogOptions
) {
  if (!readmeAPIKey) throw new Error('You must provide your ReadMe API key');

  const payload = constructPayload(req, res, payloadData, logOptions);
  return metricsAPICall(readmeAPIKey, Array.isArray(payload) ? payload : [payload], logOptions.fireAndForget);
}
