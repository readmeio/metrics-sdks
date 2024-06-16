import type { Request } from 'express';

export default function findAPIKey(req: Request): string {
  // Authorization header
  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  } else if (req.headers.authorization && req.headers.authorization.includes('Basic')) {
    const basicAuth = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
    return basicAuth[0];
  }

  // Check other headers
  // iterate over req.headers and see if api_key is in the name
  const apiKeyHeader = Object.keys(req.headers).find(
    headerName =>
      headerName.toLowerCase().includes('api-key') ||
      headerName.toLowerCase().includes('api_key') ||
      headerName.toLowerCase().includes('apikey'),
  );

  if (apiKeyHeader) {
    return req.headers[apiKeyHeader] as string;
  }

  // Is it a cookie?
  // Ok idk what to do for this case yet

  // Is it a query param?
  if (req.query.api_key) {
    return req.query.api_key as string;
  } else if (req.query.apiKey) {
    return req.query.apiKey as string;
  }

  // error case where we tell them to go the manual route
  throw new Error('test');
}
