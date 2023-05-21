import { makeHttpResponse } from "../core/response.ts";
import { HTTPRequest } from "../core/router.ts";
import { ITenant, TenantId } from "../entities/tenant_entity.ts";
import { IUser } from "../repository/user_repository.ts";
import { ApiError, makeApiHttpResponse, makeApiResponse } from "./api_service.ts";

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

export function isAdmin (token?: string): boolean {
  if (!token) {
    return false;
  }

  // 1. Find the admin user by token
  // 2. If user exist and the account is active, return true else false

  return "abcd123" === token;
}

export function isTenant (): boolean {
  return false;
}

export function isGuest (): boolean {
  return (!isAdmin() && !isTenant());
}

export function generateUserToken (tenant: ITenant | TenantId): string {
  const id = (typeof tenant === 'object') ? tenant.id as TenantId : tenant;
  return `${id}.${crypto.randomUUID().replaceAll('-', '')}`
}

export function makePermissionDeniedResponse (): Response {
  return makeApiHttpResponse(false, undefined, new ApiError('Permission denied', {
    cause: 'token_wrong'
  }))
}