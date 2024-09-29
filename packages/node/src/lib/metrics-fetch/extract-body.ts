export default function extractBody(target: Request | Response) {
  const contentType = target.headers.get('content-type');
  let body;

  if (contentType?.includes('json')) {
    target.json().then(data => {
      body = data;
    });
  } else {
    target.text().then(data => {
      body = data;
    });
  }

  return body;
}
