// We're doing this to buffer up the response body
// so we can send it off to the metrics server
// It's unfortunate that this isn't accessible
// natively. This may take up lots of memory on
import type { ExtendedResponse } from './log';

// big responses, we can make it configurable in future
export function patchResponse(res: ExtendedResponse) {
  const { write, end } = res;

  res._body = '';

  // @ts-expect-error this feels scary to mess with further
  res.write = (chunk, encoding, cb) => {
    res._body += chunk;
    write.call(res, chunk, encoding, cb);
  };

  // @ts-expect-error this feels scary to mess with further
  res.end = (chunk, encoding, cb) => {
    // Chunk is optional in res.end
    // http://nodejs.org/dist/latest/docs/api/http.html#http_response_end_data_encoding_callback
    if (chunk) res._body += chunk;
    end.call(res, chunk, encoding, cb);
  };
}
