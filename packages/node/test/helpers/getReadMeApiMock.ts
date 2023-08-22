import type { Headers } from 'headers-polyfill';

import { rest } from 'msw';

import pkg from '../../package.json';
import config from '../../src/config';

const apiKey = 'mockReadMeApiKey';

// TODO: maybe refactor this function so we can specify headers properly?
export function doHeadersMatch(headers: Headers) {
  const auth = headers.get('authorization');
  const decodedAuth = auth ? Buffer.from(auth.replace(/^Basic /, ''), 'base64').toString('ascii') : '';
  const userAgent = headers.get('user-agent');
  return decodedAuth === `${apiKey}:` && userAgent === `${pkg.name}/${pkg.version}`;
}

export default function getReadMeApiMock(baseUrl: string) {
  return rest.get(`${config.readmeApiUrl}/v1`, (req, res, ctx) => {
    if (doHeadersMatch(req.headers)) {
      return res(ctx.status(200), ctx.json({ baseUrl }));
    }
    return res(ctx.status(500));
  });
}
