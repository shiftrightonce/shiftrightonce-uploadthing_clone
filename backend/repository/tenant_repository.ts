import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";
import { getDb } from "../app.ts";
import { ITenant, Tenant, TenantId, TenantStatus } from "../entities/tenant_entity.ts";
import { Database, RestBindParameters } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";

export type TenantCommitResult = Promise<APIResponse<ITenant>>

const dummyData: Array<ITenant> = [
  {
    id: 123,
    status: TenantStatus.ACTIVE,
    name: 'default tenant',
    is_default: false
  },
  {
    id: 54353,
    status: TenantStatus.ACTIVE,
    name: 'default tenant2',
    is_default: false
  },
];

export class TenantRepository {

  private sqliteDb: Database;

  constructor() {
    this.sqliteDb = getDb()
  }

  public async findTenantById (id: TenantId): TenantCommitResult {
    const sql = `SELECT * FROM 'tenants' WHERE id = :id`;
    // const result = await this.doSelect<Record<string, unknown>>(sql, { id: id })
    // return (result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist'));

    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get({ id })
        resolve((result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public async findTenantByInternalId (internalId: number): TenantCommitResult {
    const sql = `SELECT * FROM 'tenants' WHERE internal_id = :id`;
    // const result = await this.doSelect<Record<string, unknown>>(sql, { id: internalId })
    // return (result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist'));
    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get({ id: internalId })
        resolve((result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public async fetchDefaultTenant (): TenantCommitResult {
    const sql = `SELECT * FROM 'tenants' WHERE is_default = 1`;
    // const result = await this.doSelect<Record<string, unknown>>(sql, {})
    // return (result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist'));
    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get()
        resolve((result) ? makeApiSuccessResponse(Tenant.fromRecord(result)) : makeApiFailResponse(new ApiError('Tenant does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public async getTenants (_limit = 250): Promise<APIResponse<ITenant[]>> {
    return new Promise((resolve, _reject) => {
      resolve(makeApiSuccessResponse([...dummyData]))
    })
  }

  public async createTenant (tenant: ITenant): TenantCommitResult {
    return new Promise((resolve, _reject) => {
      tenant.id = crypto.randomUUID();
      dummyData.push(tenant)

      resolve(makeApiSuccessResponse(tenant));
    })
  }


  public async createDefaultTenant (): TenantCommitResult {
    const tenant = new Tenant();
    tenant.name = 'Default Tenant';
    tenant.status = TenantStatus.ACTIVE;
    tenant.is_default = true;

    return await this.saveTenant(tenant);
  }

  public async updateTenant (tenantId: TenantId, tenant: ITenant): TenantCommitResult {
    const { tenant: existingTenant, index } = await this.pluckTenant(tenantId);

    return new Promise((resolve, _reject) => {
      if (existingTenant) {
        if (tenant.id) {
          tenant.id = existingTenant.id;
        }

        Object.assign(existingTenant, tenant);
        dummyData[index] = existingTenant;

        return resolve(makeApiSuccessResponse(existingTenant));
      }
      resolve(makeApiFailResponse(new ApiError(`Tenant '${tenantId}' does not exist`)))
    })
  }


  public async deleteTenant (tenantId: TenantId): TenantCommitResult {
    const { tenant: existingTenant, index } = await this.pluckTenant(tenantId);

    return new Promise((resolve, _reject) => {
      if (existingTenant) {
        dummyData.splice(index, 1)
        return resolve(makeApiSuccessResponse(existingTenant));
      }
      resolve(makeApiFailResponse(new ApiError(`Tenant '${tenantId}' does not exist`)))
    })
  }

  public async saveTenant (tenant: Tenant): Promise<TenantCommitResult> {
    const create_sql = `
    INSERT INTO 'tenants' ('id', 'name', 'status', 'is_default') VALUES (:id, :name, :status, :is_default)
    `;
    const update_sql = `
    UPDATE 'tenants' SET 'name' = :name, 'status' = :status, 'is_default' = :is_default WHERE internal_id = :internal_id
    `;

    return new Promise((resolve, reject) => {

      let affected = 0;

      try {

        if (tenant.internal_id) {
          affected = this.sqliteDb.exec(update_sql, {
            name: tenant.name,
            status: tenant.status,
            is_default: tenant.is_default_as_number
          })
        } else {
          console.log('data to insert', {
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
            is_default: tenant.is_default_as_number
          });

          affected = this.sqliteDb.exec(create_sql, {
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
            is_default: tenant.is_default_as_number
          })
        }

        resolve((affected) ? this.findTenantById(tenant.id) : makeApiFailResponse(new ApiError('Could save tenant')))
      } catch (error) {
        reject(error)
      }
    })

  }

  // private async doSelect<T> (sql: string, params: Record<string, unknown>): Promise<T> {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const result = this.sqliteDb.prepare(sql).get(params)
  //       resolve(result as T);
  //     } catch (error) {
  //       reject(error)
  //     }
  //   });
  // }

  private pluckTenant (tenantId: TenantId): Promise<{ tenant?: ITenant, index: number }> {
    const result: { tenant?: ITenant, index: number } = {
      index: -1
    };
    return new Promise((resolve, _reject) => {
      const _ = dummyData.filter((u, index) => {
        if (u.id == tenantId) {
          result.index = index
          result.tenant = { ...u }
          return true
        }
        return false
      });
      resolve(result)
    });
  }
}