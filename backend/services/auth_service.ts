import { HTTPRequest } from "../core/router.ts";

export function isAuthenticated () {

}

export function getTokenFromHeader (req: HTTPRequest): string | undefined {
  const token = (req.headers.get('Authorization') || req.headers.get('authorization') || '').toLowerCase().split(' ').filter((e) => e.length > 0)

  return (token.length == 2 && token[0] === 'bearer') ? token[1] : undefined;
}

export function getTokenFromQueryString (req: HTTPRequest): string | undefined {
  return req.query.get('token') || undefined
}

export function getAccessToken (req: HTTPRequest) {
  return getTokenFromHeader(req) || getTokenFromQueryString(req)
}