import type { OutgoingLogBody } from '../shared/metrics-log';
import type { PayloadData, LogOptions } from '../shared/options';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TLSSocket } from 'tls';

import { randomUUID } from 'node:crypto';
import os from 'os';
import { URL } from 'url';

import { version } from '../../../package.json';

import processRequest from './process-request';
import processResponse from './process-response';
import { mask } from '../shared/mask';

/**
 * Extracts the protocol string from the incoming request
 *
 * @param req
 * @returns
 */
export function getProto(req: IncomingMessage): 'http' | 'https' {
  return (req.socket as TLSSocket).encrypted ? 'https' : 'http';
}

export function constructPayload(
  req: IncomingMessage,
  res: ServerResponse,
  payloadData: PayloadData,
  logOptions: LogOptions,
): OutgoingLogBody {
  const serverTime = payloadData.responseEndDateTime.getTime() - payloadData.startedDateTime.getTime();

  return {
    _id: payloadData.logId || randomUUID(),
    _version: 3,
    group: {
      id: mask(payloadData.apiKey),
      label: payloadData.label,
      email: payloadData.email,
    },
    clientIPAddress: req.socket.remoteAddress || '',
    development: !!logOptions?.development,
    request: {
      log: {
        version: '1.2',
        creator: {
          name: 'readme-metrics (node)',
          version,
          // x64-darwin21.3.0/14.19.3
          comment: `${os.arch()}-${os.platform()}${os.release()}/${process.versions.node}`,
        },
        entries: [
          {
            pageref: payloadData.routePath
              ? payloadData.routePath
              : new URL(req.url || '', `${getProto(req)}://${req.headers.host}`).toString(),
            startedDateTime: payloadData.startedDateTime.toISOString(),
            time: serverTime,
            request: processRequest(req, payloadData.requestBody, logOptions),
            response: processResponse(res, payloadData.responseBody, logOptions),
            cache: {},
            timings: {
              // This requires us to know the time the request was sent to the server, so we're skipping it for now
              wait: 0,
              receive: serverTime,
            },
          },
        ],
      },
    },
  };
}
