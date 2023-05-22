import { userTenantRepo } from "../app.ts";
import { HTTPRequest } from "../core/router.ts";
import { ITenant, TenantId } from "../entities/tenant_entity.ts";
import { UserTenant, UserTenantRole, UserTenantStatus } from "../entities/user_tenant_entity.ts";
import { ApiError, makeApiHttpResponse } from "./api_service.ts";

export function isAuthenticated () {

}

export function getTokenFromHeader (req: HTTPRequest): string | undefined {
  const token = (req.headers.get('Authorization') || req.headers.get('authorization') || '').toLowerCase().split(' ').filter((e) => e.length > 0)

  return (token.length == 2 && token[0] === 'bearer') ? token[1] : undefined;
}

export function getTokenFromQueryString (req: HTTPRequest): string | undefined {
  return req.query.get('token') || undefined
}

export async function fetchUserTenant (token: string): Promise<UserTenant | false> {
  const result = await userTenantRepo.findUserByToken(token);

  return (result.success && result.data.status === UserTenantStatus.ACTIVE) ? result.data : false;
}

export function getAccessToken (req: HTTPRequest): string {
  return getTokenFromHeader(req) || getTokenFromQueryString(req) || ''
}

export function isSysAdmin (userTenant: UserTenant | false): boolean {
  if (!userTenant) {
    return false;
  }
  return userTenant.getUser()!.isSysAdmin || false;
}

export function isAdmin (userTenant: UserTenant | false): boolean {
  if (!userTenant) {
    return false;
  }

  return userTenant.roles.indexOf(UserTenantRole.ADMIN) > -1 || isSysAdmin(userTenant)
}

export function canUpload (userTenant: UserTenant | false): boolean {
  if (!userTenant) {
    return false;
  }

  return userTenant.roles.indexOf(UserTenantRole.UPLOADER) > -1 || userTenant.roles.indexOf(UserTenantRole.ADMIN) > -1 || isSysAdmin(userTenant)
}


export function isGuest (userTenant: UserTenant | false): boolean {
  return userTenant === false;
}

export function generateUserToken (tenant: ITenant | TenantId): string {
  const id = (typeof tenant === 'object') ? tenant.id as TenantId : tenant;
  return `${id}.${crypto.randomUUID().replaceAll('-', '')}`
}

export function makePermissionDeniedResponse (): Response {
  return makeApiHttpResponse(false, undefined, new ApiError('Permission denied'), { status: 419 })
}