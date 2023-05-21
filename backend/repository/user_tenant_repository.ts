import { Database } from "https://deno.land/x/sqlite3@0.9.1/src/database.ts";
import { getDb } from "../app.ts";
import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";
import { IUserTenant, UserTenant, UserTenantStatus } from "../entities/user_tenant_entity.ts";
import { Tenant } from "../entities/tenant_entity.ts";
import { User } from "../entities/user_entity.ts";
import { resolve } from "https://deno.land/std@0.119.0/path/win32.ts";

export type UserTenantCommitResult = Promise<APIResponse<IUserTenant>>

export class UserTenantRepository {
  private sqliteDb: Database;

  constructor() {
    this.sqliteDb = getDb()
  }


  public async findUserByUserAndTenant (userInternalId: number, tenantInternalId: number): UserTenantCommitResult {
    const sql = this.generateSql(' WHERE user_internal_id = :user_id AND tenant_internal_id = :tenant_id');

    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get({ user_id: userInternalId, tenant_id: tenantInternalId });
        resolve((result) ? makeApiSuccessResponse(UserTenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Could not find record')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public async addUserToTenant (user: User, tenant: Tenant): UserTenantCommitResult {
    const create_sql = `INSERT INTO 'user_tenants' ('user_internal_id', 'tenant_internal_id', 'roles', 'status') 
     VALUES (:user_id, :tenant_id, :roles, :status)
    `;

    const record = new UserTenant();
    record.setTenant(tenant)
    record.setUser(user);
    record.status = UserTenantStatus.ACTIVE;
    record.refreshToken();

  }

  findUserByToken (token: string): Promise<APIResponse> {

  }


  private generateSql (whereClause: string): string {
    return `
    SELECT 
	  user_tenants.roles,
    user_tenants.status,
    user_tenants.tenant_internal_id,
    user_tenants.token,
    user_tenants.user_internal_id,	
	users.id as users_tbl_id,
	users.internal_id as users_tbl_internal_id,
	users.name as users_tbl_name,
	users.status as users_tbl_status,
	users.system_admin as users_tbl_system_admin,
	tenants.id as tenants_tbl_id,
	tenants.internal_id as tenants_tbl_internal_id,
	tenants.name as tenants_tbl_name,
	tenants.status as tenants_tbl_status
FROM 'user_tenants'

LEFT JOIN users on users.internal_id = user_tenants.user_internal_id
LEFT JOIN tenants on tenants.internal_id = user_tenants.tenant_internal_id

    ${whereClause}
    `;
  }

}