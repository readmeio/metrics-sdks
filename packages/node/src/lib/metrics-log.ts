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
  id?: string;
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
  ids: string | Array<string>;
}

function getLogIds(body: OutgoingLogBody | Array<OutgoingLogBody>): string | Array<string> {
  if (Array.isArray(body)) {
    return body.map(value => value._id);
  }

  return body._id;
}

// This is mostly defined in construct-payload.ts. We might want to do some consolidation between that and this.
// Also, how do we reconsile this and the batch requests? todo.....

export function metricsAPICall(
  readmeAPIKey: string,
  body: Array<OutgoingLogBody>,
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
