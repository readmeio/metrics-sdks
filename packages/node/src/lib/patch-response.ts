// We're doing this to buffer up the response body
// so we can send it off to the metrics server
// It's unfortunate that this isn't accessible
// natively. This may take up lots of memory on
import type { ExtendedResponse } from './log';

// big responses, we can make it configurable in future
export function patchResponse(res: ExtendedResponse) {
  const { write, end } = res;

  res._body = '';

  // @ts-expect-error these lines are messing with Node internals and
  // I'm not sure what exactly typing fix is needed here that doesn't have
  // some sort of adverse impact on our response handling.
  res.write = (chunk, encoding, cb) => {
    res._body += chunk;
    write.call(res, chunk, encoding, cb);
  };

  // @ts-expect-error these lines are messing with Node internals and
  // I'm not sure what exactly typing fix is needed here that doesn't have
  // some sort of adverse impact on our response handling.
  res.end = (chunk, encoding, cb) => {
    // Chunk is optional in res.end
    // http://nodejs.org/dist/latest/docs/api/http.html#http_response_end_data_encoding_callback
    if (chunk) res._body += chunk;
    end.call(res, chunk, encoding, cb);
  };
}
