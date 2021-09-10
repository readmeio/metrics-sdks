import fetch from 'node-fetch';
import timeoutSignal from 'timeout-signal';
import pkg from '../../package.json';
import config from '../config';
import { GroupingObject } from './construct-payload';
// Ignoring the following issue because we're just pulling in the type. We might not want to error at all on no-unresolved when using typescript
// eslint-disable-next-line import/no-unresolved
import { Har } from 'har-format';

// This is mostly defined in construct-payload.ts. We might want to do some consolidation between that and this.
// Also, how do we reconsile this and the batch requests? todo.....
export interface LogBody {
  clientIPAddress: string;
  development: boolean;
  group: GroupingObject;
  request: Har;
}

export function log(readmeAPIKey: string, body: LogBody | Array<LogBody>) {
  const signal = timeoutSignal(config.timeout);

  return fetch(`${config.host}/v1/request`, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Basic ${readmeAPIKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `${pkg.name}/${pkg.version}`,
    },
    signal,
  }).finally(() => {
    timeoutSignal.clear(signal);
  });
}
