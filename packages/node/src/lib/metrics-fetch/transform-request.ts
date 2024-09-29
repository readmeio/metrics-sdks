import type { ExtendedIncomingMessage } from '../metrics-node/log';

import { IncomingMessage } from 'http';
import * as net from 'net';

export function transfromRequest(req: Request): ExtendedIncomingMessage {
  const incomingMessage = new IncomingMessage(new net.Socket()) as ExtendedIncomingMessage;
  const headers: Record<string, string> = {};

  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  incomingMessage.url = req.url || '';
  incomingMessage.method = req.method || 'GET';
  incomingMessage.headers = headers;

  return incomingMessage;
}
