export function makeHttpResponse (body: string): Response {
  const response = new Response(body);
  response.headers.set('content-type', 'text/html');

  return response;
}


export function makeJSONResponse (body: unknown): Response {
  const response = new Response(JSON.stringify(body));
  response.headers.set('content-type', 'application/json');

  return response;
}