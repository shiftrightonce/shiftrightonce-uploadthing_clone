import { tenantRepo, userRepo, userTenantRepo } from "../../app.ts";
import { makeJSONResponse } from "../../core/response.ts";
import { HTTPRequest, IRouter } from "../../core/router.ts";
import { TenantId } from "../../entities/tenant_entity.ts";
import { DbCursor } from "../../repository/repository_helper.ts";
import { TenantRepository } from "../../repository/tenant_repository.ts";
import { UserRepository } from "../../repository/user_repository.ts";
import { UserTenantRepository } from "../../repository/user_tenant_repository.ts";

class AdminUserTenantController {
  constructor(private tenantRepo = new TenantRepository(), private userTenantRepo = new UserTenantRepository(), private userRepo = new UserRepository()) { }

  public async getUsers (req: HTTPRequest) {
    const result = await this.pluckTenantResult(req);
    const cursor = DbCursor.fromHttpRequest(req) || '';
    const withDeleted = (req.query.get('delete')) ? true : false;

    return makeJSONResponse((result.success) ? await this.userTenantRepo.findUsersByTenant(result.data, withDeleted, cursor) : result);
  }

  private async pluckTenantResult (req: HTTPRequest) {
    const id = req.param<TenantId>('id') || 0;
    return await this.tenantRepo.findTenantById(id);
  }
}

export function registerAdminUserTenantRoutes (router: IRouter): IRouter {
  const controller = new AdminUserTenantController(tenantRepo, userTenantRepo, userRepo);

  router.get('tenants/:id/users', controller, 'getUsers');

  return router;
}