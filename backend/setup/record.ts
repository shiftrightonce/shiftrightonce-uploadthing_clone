import { Tenant } from "../entities/tenant_entity.ts";
import { User } from "../entities/user_entity.ts";
import { UserTenant, UserTenantRole } from "../entities/user_tenant_entity.ts";
import { TenantRepository } from "../repository/tenant_repository.ts";
import { UserRepository } from "../repository/user_repository.ts";
import { UserTenantCommitResult, UserTenantRepository } from "../repository/user_tenant_repository.ts";


/**
 * Creates and dump the default User, Tenant and User API token
 * 
 * @param userRepo 
 * @param tenantRepo 
 * @param userTenantRepo 
 */
export async function setupDefaultUserAndTenant (userRepo: UserRepository, tenantRepo: TenantRepository, userTenantRepo: UserTenantRepository) {

  const defaultUserResult = await userRepo.fetchDefaultUser();
  const defaultTenantResult = await tenantRepo.fetchDefaultTenant()

  let user: User = defaultUserResult.data;
  let tenant: Tenant = defaultTenantResult.data;

  // check if we have a system_admin
  if (!defaultUserResult.success) {
    user = (await userRepo.createDefaultSystemAdmin()).data as User;
  }

  if (!defaultTenantResult.success) {
    tenant = (await tenantRepo.createDefaultTenant()).data as Tenant;
  }

  let showInfo = false;
  let userTenant: UserTenant = new UserTenant();

  if (!defaultUserResult.success || !defaultTenantResult.success) {
    userTenant = (await userTenantRepo.addUserToTenant(user, tenant, UserTenantRole.ADMIN)).data;
    showInfo = true;
  } else if (Deno.env.get('UPLOAD_SOMETHING_ENV') === 'dev') {
    userTenant = (await userTenantRepo.findUserByUserAndTenant(user, tenant)).data;
    showInfo = true;
  }

  if (showInfo) {
    console.table({
      'User ID': user.id,
      'API Token': userTenant.token,
      'Tenant ID': tenant.id
    })
  }
}