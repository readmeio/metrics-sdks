import type { ExtendedResponse } from '../metrics-node/log';
import type { IncomingMessage } from 'http';

import { ServerResponse } from 'http';
import { ReadableStream } from 'stream/web';

export function transformResponse(incomingMessage: IncomingMessage, res: Response): ExtendedResponse {
  const serverResponse = new ServerResponse(incomingMessage) as ExtendedResponse;

  res.headers.forEach((value, key) => {
    serverResponse.setHeader(key, value);
  });

  serverResponse.statusCode = res.status;
  serverResponse.statusMessage = res.statusText;

  if (res.body instanceof ReadableStream) {
    const reader = res.body?.getReader();
    const readStream = async () => {
      const { done, value } = await reader.read();
      if (done) {
        serverResponse.end();
        return;
      }
      serverResponse.write(Buffer.from(value));
      readStream();
    };

    readStream();
  } else {
    serverResponse.write(res.body);
    serverResponse.end();
  }

  return serverResponse;
}
