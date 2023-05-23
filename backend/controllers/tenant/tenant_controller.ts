import { tenantRepo, userRepo, userTenantRepo } from "../../app.ts";
import { makeJSONResponse } from "../../core/response.ts";
import { HTTPRequest, IRouter } from "../../core/router.ts";
import { Tenant } from "../../entities/tenant_entity.ts";
import { UserTenant } from "../../entities/user_tenant_entity.ts";
import { DbCursor } from "../../repository/repository_helper.ts";
import { TenantRepository } from "../../repository/tenant_repository.ts";
import { UserRepository } from "../../repository/user_repository.ts";
import { UserTenantRepository } from "../../repository/user_tenant_repository.ts";

export class TenantController {
  private tenantRepo: TenantRepository;
  private userRepo: UserRepository;
  private userTenantRepo: UserTenantRepository;

  constructor(tenantRepo = new TenantRepository(), userRepo = new UserRepository(), userTenantRepo = new UserTenantRepository()) {
    this.tenantRepo = tenantRepo;
    this.userRepo = userRepo;
    this.userTenantRepo = userTenantRepo;
  }

  public async getUsers (req: HTTPRequest) {
    const cursor = DbCursor.fromHttpRequest(req) || '';
    const withDeleted = (req.query.get('delete')) ? true : false;

    return makeJSONResponse(await this.userTenantRepo.findUsersByTenant(this.pluckTenant(req), withDeleted, cursor))
  }

  public async generateUploadLink (req: HTTPRequest) {
    const authUser = this.pluckUserTenant(req);
    const tenant = this.pluckTenant(req);


  }


  private pluckTenant (req: HTTPRequest): Tenant {
    const userTenant = this.pluckUserTenant(req);
    return userTenant.getTenant()!
  }

  private pluckUserTenant (req: HTTPRequest): UserTenant {
    return req.getData('userTenant') as UserTenant;
  }
}


export function registerTenantController (r: IRouter): IRouter {
  const controller = new TenantController(tenantRepo, userRepo, userTenantRepo)

  r.get('users', controller, 'getUsers')

  return r;
}