import { makeJSONResponse } from "../../core/response.ts";
import { HTTPRequest, IRouter } from "../../core/router.ts";
import { Tenant, TenantId } from "../../entities/tenant_entity.ts";
import { TenantRepository } from "../../repository/tenant_repository.ts";
import { UserTenantRepository } from "../../repository/user_tenant_repository.ts";
import { ApiError, makeApiFailResponse } from "../../services/api_service.ts";

class AdminTenantController {

  constructor(private tenantRepo = new TenantRepository(), private userTenantRepo = new UserTenantRepository()) { }

  public async getTenants (_request: HTTPRequest) {
    return makeJSONResponse(await this.tenantRepo.getTenants())
  }

  public async getTenantById (request: HTTPRequest) {
    const id = request.param<TenantId>('id') || false;

    if (id) {
      return makeJSONResponse(await this.tenantRepo.findTenantById(id as TenantId))
    }

    return makeJSONResponse(makeApiFailResponse(new ApiError('ID does not exist')));
  }

  public async create (request: HTTPRequest) {
    const data = await request.req.json() as Tenant;
    return makeJSONResponse(await this.tenantRepo.createTenant(data))
  }

  public async update (request: HTTPRequest) {
    const data = await request.req.json() as Tenant;
    const id = request.param<TenantId>('id') || false;

    if (id) {
      return makeJSONResponse(await this.tenantRepo.updateTenant(id as TenantId, data))
    }

    return makeJSONResponse(makeApiFailResponse(new ApiError('ID does not exist')));
  }

  public async deleteTenant (request: HTTPRequest) {
    const id = request.param<TenantId>('id') || false;
    if (id) {
      return makeJSONResponse(await this.tenantRepo.deleteTenant(id as TenantId))
    }

    return makeJSONResponse(makeApiFailResponse(new ApiError('ID does not exist')));
  }
}



export function registerAdminTenantRoutes (router: IRouter): IRouter {
  const controller = new AdminTenantController();

  router.get('tenants', controller, 'getTenants');
  router.get('tenants/:id', controller, 'getTenantById');
  router.post('tenants', controller, 'create');
  router.put('tenants/:id', controller, 'update');
  router.delete('tenants/:id', controller, 'deleteTenant');

  return router;
}