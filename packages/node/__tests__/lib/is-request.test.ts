import MockReq from 'mock-req';

import isRequest from '../../src/lib/is-request';

test('should detect `text/plain', () => {
  const req = new MockReq({
    method: 'post',
    url: '/anything',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-length': 1337,
    },
  });

  req.write('buster');
  req.end();

  expect(isRequest(req, 'text/*')).toBe(true);
});

test('should detect vendored json', () => {
  const req = new MockReq({
    method: 'post',
    url: '/anything',
    headers: {
      'content-type': 'application/vnd.api+json',
      'content-length': 1337,
    },
  });

  req.write(JSON.stringify(['buster']));
  req.end();

  expect(isRequest(req, 'json')).toBe(false); // `type-is` doesn't support identifying vendored JSON with this.
  expect(isRequest(req, '+json')).toBe(true);
});

test('should detect `application/x-www-form-urlencoded`', () => {
  const payload = new URLSearchParams();
  payload.append('user', 'buster');

  const req = new MockReq({
    method: 'post',
    url: '/anything',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 1337,
    },
  });

  req.write(payload.toString());
  req.end();

  expect(isRequest(req, 'application/x-www-form-urlencoded')).toBe(true);
});
