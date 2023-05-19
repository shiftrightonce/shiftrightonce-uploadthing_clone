import { resolve } from "https://deno.land/std@0.119.0/path/win32.ts";
import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";

export type TenantId = string | number;

export interface ITenant {
  id?: TenantId,
  name: string,
}

export type TenantCommitResult = Promise<APIResponse<ITenant>>

const dummyData: Array<ITenant> = [
  {
    id: 123,
    name: 'default tenant'
  },
  {
    id: 54353,
    name: 'default tenant2'
  },
];

export class TenantRepository {

  public async findTenantById (id: TenantId): Promise<APIResponse<ITenant>> {
    const { tenant } = await this.pluckTenant(id);
    return (tenant) ? makeApiSuccessResponse(tenant) : makeApiFailResponse(new ApiError('Tenant does not exist'))
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

  public async updateTenant (tenantId: TenantId, tenant: ITenant): TenantCommitResult {
    const { tenant: existingTenant, index } = await this.pluckTenant(tenantId);

    return new Promise((resolve, _reject) => {
      if (existingTenant) {
        if (tenant.id) {
          delete tenant.id;
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