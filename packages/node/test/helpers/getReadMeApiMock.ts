import { http, HttpResponse } from 'msw';

import pkg from '../../package.json';
import config from '../../src/config';

const apiKey = 'mockReadMeApiKey';

function doHeadersMatch(headers: Headers) {
  const auth = headers.get('authorization');
  const decodedAuth = auth ? Buffer.from(auth.replace(/^Basic /, ''), 'base64').toString('ascii') : '';
  const userAgent = headers.get('user-agent');
  return decodedAuth === `${apiKey}:` && userAgent === `${pkg.name}/${pkg.version}`;
}

export default function getReadMeApiMock(baseUrl: string) {
  return http.get(`${config.readmeApiUrl}/v1`, ({ request }) => {
    if (doHeadersMatch(request.headers)) {
      return HttpResponse.json({ baseUrl }, { status: 200 });
    }
    return new HttpResponse(null, { status: 500 });
  });
}
