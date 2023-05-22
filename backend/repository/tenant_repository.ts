import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";
import { getDb } from "../app.ts";
import { ITenant, Tenant, TenantId, TenantStatus } from "../entities/tenant_entity.ts";
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { DbCursor } from "./repository_helper.ts";

export type TenantCommitResult = Promise<APIResponse<Tenant>>

export class TenantRepository {

  private sqliteDb: Database;

  constructor() {
    this.sqliteDb = getDb()
  }

  public findTenantById (id: TenantId, withDeleted = false): TenantCommitResult {
    let sql: string;
    if (withDeleted) {
      sql = `SELECT * FROM 'tenants' WHERE id = :id`;
    } else {
      sql = `SELECT * FROM 'tenants' WHERE id = :id AND deleted_at = 0`;
    }

    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get({ id })
        resolve((result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public findTenantByInternalId (internalId: number, withDeleted = false): TenantCommitResult {
    let sql: string;

    if (withDeleted) {
      sql = `SELECT * FROM 'tenants' WHERE internal_id = :id`;
    } else {
      sql = `SELECT * FROM 'tenants' WHERE internal_id = :id AND deleted_at = 0`;
    }

    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get({ id: internalId })
        resolve((result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public fetchDefaultTenant (): TenantCommitResult {
    const sql = `SELECT * FROM 'tenants' WHERE is_default = 1 AND deleted_at = 0`;

    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get()
        resolve((result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Default tenant does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public getTenants (withDeleted = false, cursor: string | DbCursor = ''): Promise<APIResponse<{
    cursors: {
      current: string,
      next: string | null
    },
    page: ITenant[]
  }>> {
    const dbCursor = (typeof cursor === 'string') ? DbCursor.fromString(cursor) : cursor;
    const sql = (withDeleted) ? `SELECT * FROM 'tenants' WHERE ${dbCursor.toSql()}` : `SELECT * FROM 'tenants' WHERE deleted_at = 0 AND ${dbCursor.whereSql()} ${dbCursor.orderBySql()} ${dbCursor.limitSql()} `;
    let last = '';

    const page = this.sqliteDb.prepare(sql).all().map((r) => {
      last = r[dbCursor.field] || '';
      return Tenant.fromRecord(r)
    });

    const next = dbCursor.next(page.length, last)?.toEncodedString();

    return new Promise((resolve, _reject) => {
      resolve(makeApiSuccessResponse({
        cursors: {
          current: dbCursor.toEncodedString(),
          next: next || null
        },
        page
      }))
    })
  }

  public async createTenant (tenant: Tenant): TenantCommitResult {
    return await this.saveTenant(tenant)
  }


  public async createDefaultTenant (): TenantCommitResult {
    const tenant = new Tenant();
    tenant.name = 'Default Tenant';
    tenant.status = TenantStatus.ACTIVE;
    tenant.is_default = true;

    return await this.saveTenant(tenant);
  }

  public async updateTenant (tenantId: TenantId, tenant: Tenant): TenantCommitResult {
    const result = await this.findTenantById(tenantId);

    if (result.success) {
      result.data.merge(tenant);
      return await this.saveTenant(result.data);
    }

    return result;

  }

  public async softDeleteTenant (tenantId: TenantId | Tenant): TenantCommitResult {
    const id = (typeof tenantId === 'object') ? tenantId.id : tenantId;
    const sql = `UPDATE 'tenants' SET updated_at = :updated_at, deleted_at = 0 WHERE id= :id`;
    const result = await this.findTenantById(id);

    if (result.success) {
      const ts = Date.now();
      this.sqliteDb.exec(sql, { id: result.data.id, updated_at: ts, deleted_at: ts });
    }

    return await this.findTenantById(id, true);
  }

  public async harDeleteTenant (tenantId: TenantId | Tenant): TenantCommitResult {
    const id = (typeof tenantId === 'object') ? tenantId.id : tenantId;
    const sql = `DELETE * FROM 'users' WHERE id = :id `;

    const result = await this.findTenantById(id);

    if (result.success) {
      this.sqliteDb.exec(sql, { id: result.data.id })
    }

    return result;

  }

  public async restoreTenant (tenant: TenantId | Tenant): TenantCommitResult {
    const sql = `UPDATE 'users' SET updated_at = :updated_at, deleted_at = 0 WHERE id= :id`;
    const id = (typeof tenant === 'object') ? tenant.id : tenant;
    const result = await this.findTenantById(id, true);

    if (result.success) {
      this.sqliteDb.exec(sql, { updated_at: Date.now() })
    }

    return await this.findTenantById(id);

  }

  public saveTenant (tenant: Tenant): TenantCommitResult {
    const create_sql = `
    INSERT INTO 'tenants' ('id', 'name', 'status', 'is_default', 'created_at') VALUES (:id, :name, :status, :is_default, :created_at)
    `;
    const update_sql = `
    UPDATE 'tenants' SET 'name' = :name, 'status' = :status, 'is_default' = :is_default, 'updated_at' = :updated_at WHERE internal_id = :internal_id
    `;

    return new Promise((resolve, reject) => {

      let affected = 0;

      try {

        if (tenant.internal_id) {
          affected = this.sqliteDb.exec(update_sql, {
            name: tenant.name,
            status: tenant.status,
            is_default: tenant.is_default_as_number,
            updated_at: Date.now()
          })
        } else {
          affected = this.sqliteDb.exec(create_sql, {
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
            is_default: tenant.is_default_as_number,
            created_at: Date.now(),
          })
        }

        resolve((affected) ? this.findTenantById(tenant.id) : makeApiFailResponse(new ApiError('Could save tenant')))
      } catch (error) {
        reject(error)
      }
    })

  }

}