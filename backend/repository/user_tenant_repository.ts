import { Database } from "https://deno.land/x/sqlite3@0.9.1/src/database.ts";
import { getDb } from "../app.ts";
import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";
import { UserTenant, UserTenantRole, UserTenantStatus } from "../entities/user_tenant_entity.ts";
import { Tenant } from "../entities/tenant_entity.ts";
import { User } from "../entities/user_entity.ts";
import { DbCursor } from "./repository_helper.ts";

export type UserTenantCommitResult = Promise<APIResponse<UserTenant>>

export class UserTenantRepository {
  private sqliteDb: Database;

  constructor() {
    this.sqliteDb = getDb()
  }


  public findUserByUserAndTenant (userInternalId: number | User, tenantInternalId: number | Tenant): UserTenantCommitResult {
    const sql = this.generateSql(' WHERE user_internal_id = :user_id AND tenant_internal_id = :tenant_id');

    return new Promise((resolve, reject) => {
      try {
        const userId = (typeof userInternalId === 'object') ? userInternalId.internal_id : userInternalId;
        const tenantId = (typeof tenantInternalId === 'object') ? tenantInternalId.internal_id : tenantInternalId;

        const result = this.sqliteDb.prepare(sql).get({ user_id: userId, tenant_id: tenantId });
        resolve((result) ? makeApiSuccessResponse(UserTenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Could not find record')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public findUserByToken (token: string, withDeleted = false): Promise<APIResponse<UserTenant>> {
    const sql = this.generateSql((withDeleted) ? ` WHERE token = :token` : ' WHERE token = :token AND user_tenants.deleted_at = 0');
    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get({ token });
        resolve((result) ? makeApiSuccessResponse(UserTenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Could not find record')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public findUsersByTenant (tenant: number | Tenant, withDeleted = false, cursor: string | DbCursor = ''): Promise<APIResponse<{
    cursors: {
      current: string,
      next: string | null
    },
    page: UserTenant[]
  }>> {
    const dbCursor = (typeof cursor === 'string') ? DbCursor.fromString(cursor) : cursor;
    dbCursor.prefix = 'user_tenants';

    const sql = this.generateSql((withDeleted) ? ` WHERE tenant_internal_id = :tenant_id AND ${dbCursor.toSql()} ` : ` WHERE tenant_internal_id = :tenant_id AND user_tenants.deleted_at = 0 AND ${dbCursor.whereSql()} ${dbCursor.orderBySql()} ${dbCursor.limitSql()} `);

    return new Promise((resolve, reject) => {
      let last = '';
      try {
        const tenantId = (typeof tenant === 'object') ? tenant.internal_id : tenant;
        const results = this.sqliteDb.prepare(sql).all({ tenant_id: tenantId }).map((r) => {
          last = r[dbCursor.field] || '';
          return UserTenant.fromRecord(r)
        });
        const next = dbCursor.next(results.length, last)?.toEncodedString();

        resolve(makeApiSuccessResponse({
          cursors: {
            current: dbCursor.toEncodedString(),
            next: next || null,
          },
          page: results
        }));
      } catch (error) {
        reject(error)
      }
    });
  }

  public async addUserToTenant (user: User, tenant: Tenant, role: UserTenantRole | UserTenantRole[]): UserTenantCommitResult {
    const result = await this.findUserByUserAndTenant(user, tenant);

    role = Array.isArray(role) ? role : [role];

    if (result.success) {
      result.data.status = UserTenantStatus.ACTIVE;
      result.data.roles = role;
      return await this.saveUserTenant(result.data);
    } else {
      const record = new UserTenant();
      record.setTenant(tenant);
      record.setUser(user);
      record.status = UserTenantStatus.ACTIVE;
      record.addRole(role);
      record.refreshToken();
      return await this.saveUserTenant(record);
    }
  }

  public async softRemoveUserFromTenant (user: User, tenant: Tenant): UserTenantCommitResult {
    const result = await this.findUserByUserAndTenant(user, tenant);
    const sql = `UPDATE 'user_tenants' SET deleted_at = :deleted_at WHERE user_internal_id = :user_id AND tenant_internal_id = :tenant_id`;

    if (result.success) {
      this.sqliteDb.exec(sql, { deleted_at: Date.now(), user_id: user.internal_id, tenant_id: tenant.internal_id });
    }

    return result;
  }

  public async softDeleteUserTenant (userTenant: UserTenant): UserTenantCommitResult {
    const result = await this.findUserByUserAndTenant(userTenant.user_internal_id, userTenant.tenant_internal_id);

    if (result) {
      return await this.softRemoveUserFromTenant(result.data.getUser()!, result.data.getTenant()!)
    }

    return result;
  }

  public async hardDeleteUserTenant (userTenant: UserTenant): UserTenantCommitResult {
    const result = await this.findUserByUserAndTenant(userTenant.user_internal_id, userTenant.tenant_internal_id);

    if (result) {
      return await this.hardRemoveUserFromTenant(result.data.getUser()!, result.data.getTenant()!)
    }

    return result;
  }

  public async hardRemoveUserFromTenant (user: User, tenant: Tenant): UserTenantCommitResult {
    const result = await this.findUserByUserAndTenant(user, tenant);
    const sql = `DELETE * FROM 'user_tenants' WHERE user_internal_id = :user_id AND tenant_internal_id = :tenant_id`;

    if (result.success) {
      this.sqliteDb.exec(sql, { user_id: user.internal_id, tenant_id: tenant.internal_id });
    }

    return result;
  }

  private saveUserTenant (userTenant: UserTenant): UserTenantCommitResult {
    const create_sql = `INSERT INTO 'user_tenants' ('user_internal_id', 'tenant_internal_id', 'roles', 'status', 'token', 'created_at', 'constrain') VALUES (:user_id, :tenant_id, :roles, :status, :token, :created_at, :constrain) `;
    const update_sql = `UPDATE 'user_tenants' SET  'status' = :status, 'token' = :token, updated_at = :updated_at, roles = :roles, constrain = :constrain WHERE user_internal_id = :user_id AND tenant_internal_id = :tenant_id`;

    return new Promise((resolve, reject) => {
      try {
        let affected = 0;
        if (userTenant.created_at) {
          affected = 1;
          this.sqliteDb.exec(update_sql, {
            status: userTenant.statusAsNumber,
            token: userTenant.token,
            roles: JSON.stringify(userTenant.roles),
            constrain: (userTenant.hasConstrain()) ? JSON.stringify(userTenant.constrain) : null,
            updated_at: Date.now(),
          });
        } else {
          affected = this.sqliteDb.exec(create_sql, {
            user_id: userTenant.user_internal_id,
            tenant_id: userTenant.tenant_internal_id,
            status: userTenant.statusAsNumber,
            token: userTenant.token,
            roles: JSON.stringify(userTenant.roles),
            constrain: (userTenant.hasConstrain()) ? JSON.stringify(userTenant.constrain) : null,
            created_at: Date.now(),
          })
        }

        resolve((affected) ? this.findUserByUserAndTenant(userTenant.user_internal_id, userTenant.tenant_internal_id) : makeApiFailResponse(new ApiError('Could not save the user\'s tenant record')));

      } catch (error) {
        reject(error);
      }
    });
  }

  private generateSql (whereClause: string): string {
    return `
    SELECT 
	  user_tenants.roles,
    user_tenants.status,
    user_tenants.tenant_internal_id,
    user_tenants.token,
    user_tenants.user_internal_id,	
    user_tenants.created_at,
    user_tenants.updated_at,
    user_tenants.deleted_at,	
	  users.id as users_tbl_id,
	  users.internal_id as users_tbl_internal_id,
	  users.name as users_tbl_name,
	  users.status as users_tbl_status,
	  users.system_admin as users_tbl_system_admin,
	  users.created_at as users_tbl_created_at,
	  users.updated_at as users_tbl_updated_at,
	  users.deleted_at as users_tbl_deleted_at,
	  tenants.id as tenants_tbl_id,
	  tenants.internal_id as tenants_tbl_internal_id,
	  tenants.name as tenants_tbl_name,
	  tenants.status as tenants_tbl_status,
	  tenants.created_at as tenants_tbl_created_at,
	  tenants.updated_at as tenants_tbl_updated_at,
	  tenants.deleted_at as tenants_tbl_deleted_at 

    FROM 'user_tenants'

    LEFT JOIN users on users.internal_id = user_tenants.user_internal_id
    LEFT JOIN tenants on tenants.internal_id = user_tenants.tenant_internal_id

    ${whereClause}
    `;
  }

}