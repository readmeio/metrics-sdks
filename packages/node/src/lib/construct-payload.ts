import processRequest from './process-request';
import processResponse from './process-response';
import { name, version } from '../../package.json';
import { ServerResponse, IncomingMessage } from 'http';
import { OutgoingLogBody } from './metrics-log';
import { v4 as uuidv4 } from 'uuid';
import { URL } from 'url';
import { TLSSocket } from 'tls';

/**
 * Extracts the protocol string from the incoming request
 *
 * @param req
 * @returns
 */
export function getProto(req: IncomingMessage): 'https' | 'http' {
  return (req.socket as TLSSocket).encrypted ? 'https' : 'http';
}

export interface LogOptions {
  /**
   * An array of values to redact from the incoming and outgoing headers, parameters and body
   */
  denylist?: Array<string>;

  /**
   * @deprecated use denylist instead
   */
  blacklist?: Array<string>;

  /**
   * An array of values to include in the incoming and outgoing headers, parameters and body.
   *  Everything else will be redacted.
   *
   * If set, the denylist will be ignored.
   */
  allowlist?: Array<string>;

  /**
   * @deprecated use allowList instead
   */
  whitelist?: Array<string>;

  /**
   * If true, the logs will be marked as development logs
   */
  development?: boolean;

  /**
   * If true, this will return the log details without waiting for a response from the metrics servers
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

/**
 * Translates Nodes platform strings into the allowed metrics platform strings
 *
 * @param platform
 * @returns
 */
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
    development: !!logOptions?.development,
    request: {
      log: {
        creator: { name, version, comment: `${fixPlatform(process.platform)}/${process.version}` },
        entries: [
          {
            pageref: payloadData.routePath
              ? new URL(payloadData.routePath, `${getProto(req)}://${req.headers.host}`).toString()
              : new URL(req.url, `${getProto(req)}://${req.headers.host}`).toString(),
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
