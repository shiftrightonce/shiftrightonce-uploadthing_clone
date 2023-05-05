export function makeHttpResponse (body: string): Response {
  const response = new Response(body);
  response.headers.set('content-type', 'text/html');

  return response;
}