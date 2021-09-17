import fetch, { Response } from 'node-fetch';
import timeoutSignal from 'timeout-signal';
import pkg from '../../package.json';
import config from '../config';
import { constructPayload, PayloadData, LogOptions } from './construct-payload';
import { ServerResponse, IncomingMessage } from 'http';
// eslint-disable-next-line import/no-unresolved
import { Har } from 'har-format';

export interface GroupingObject {
  // @todo: document this
  apiKey: string;
  /**
   * @deprecated use apiKey instead
   */
  id: string;
  // @todo: document this
  label: string;
  // @todo: document this
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
  logUrl: string | Array<string>;
}

function getLogUrls(body: OutgoingLogBody | Array<OutgoingLogBody>): string | Array<string> {
  const baseUrl = 'TODO';
  if (Array.isArray(body)) {
    return body.map(value => `${baseUrl}/${value._id}`);
  }

  return `${baseUrl}/${body._id}`;
}

// This is mostly defined in construct-payload.ts. We might want to do some consolidation between that and this.
// Also, how do we reconsile this and the batch requests? todo.....

export function metricsAPICall(
  readmeAPIKey: string,
  body: OutgoingLogBody | Array<OutgoingLogBody>,
  fireAndForget = false
): Promise<LogResponse> {
  const signal = timeoutSignal(config.timeout);
  const encodedKey = Buffer.from(`${readmeAPIKey}:`).toString('base64');

  const makeRequest = () => {
    return fetch(`${config.host}/v1/request`, {
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
      logUrl: getLogUrls(body),
    });
  }

  return makeRequest().then(response => ({
    response,
    logUrl: getLogUrls(body),
  }));
}

export function log(
  readmeAPIKey: string,
  req: IncomingMessage,
  res: ServerResponse,
  payloadData: PayloadData,
  logOptions: LogOptions
) {
  return metricsAPICall(readmeAPIKey, constructPayload(req, res, payloadData, logOptions), logOptions.fireAndForget);
}
