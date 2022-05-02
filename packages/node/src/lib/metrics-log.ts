import type { Har } from 'har-format';
import type { Response } from 'node-fetch';

import fetch from 'node-fetch';
import timeoutSignal from 'timeout-signal';

import pkg from '../../package.json';
import config from '../config';

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
  label?: string;
  /**
   * Email of the user that is making the call
   */
  email?: string;
}

export interface OutgoingLogBody {
  _id?: string;
  _version: number;
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
