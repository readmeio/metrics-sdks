import processRequest from './process-request';
import processResponse from './process-response';
import { name, version } from '../../package.json';
import { ServerResponse, IncomingMessage } from 'http';
import { OutgoingLogBody } from './metrics-log';
import { v4 as uuidv4 } from 'uuid';
import { URL } from 'url';
import { TLSSocket } from 'tls';

/**
 *
 * @param req
 * @returns
 */
export function getProto(req: IncomingMessage): 'HTTPS' | 'HTTP' {
  return (req.socket as TLSSocket).encrypted ? 'HTTPS' : 'HTTP';
}

export interface LogOptions {
  /**
   *
   */
  denylist?: [];
  /**
   * @deprecated use denylist instead
   */
  blacklist?: [];
  /**
   *
   */
  allowlist?: [];
  /**
   * @deprecated use allowList instead
   */
  whitelist?: [];
  /**
   *
   */
  development?: boolean;
  /**
   *
   */
  fireAndForget?: boolean;
}

export interface PayloadData {
  apiKey: string;
  label: string;
  email: string;
  startedDateTime: Date;
  responseEndDateTime: Date;
  logId?: string;
  routePath?: string;
  requestBody?: Record<string, unknown>;
  responseBody?: string;
}

function fixPlatform(platform: string): 'mac' | 'windows' | 'linux' | 'unknown' {
  switch (platform) {
    case 'darwin':
      return 'mac';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}

export function constructPayload(
  req: IncomingMessage,
  res: ServerResponse,
  payloadData: PayloadData,
  logOptions: LogOptions
): OutgoingLogBody {
  const serverTime = payloadData.responseEndDateTime.getTime() - payloadData.startedDateTime.getTime();

  return {
    _id: payloadData.logId || uuidv4(),
    group: {
      id: payloadData.apiKey,
      label: payloadData.label,
      email: payloadData.email,
    },
    clientIPAddress: req.socket.remoteAddress,
    development: logOptions.development,
    request: {
      log: {
        creator: { name, version, comment: `${fixPlatform(process.platform)}/${process.version}` },
        entries: [
          {
            pageref: payloadData.routePath || new URL(req.url, `${getProto(req)}://${req.headers.host}`).pathname,
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
        version: '', // what har version are we using? does it matter?
      },
    },
  };
}
