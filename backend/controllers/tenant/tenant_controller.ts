import { makeJSONResponse } from "../../core/response.ts";
import { HTTPRequest, IRouter } from "../../core/router.ts";
import { ITenant, TenantRepository } from "../../repository/tenant_repository.ts";
import { UserRepository } from "../../repository/user_repository.ts";
import { makeApiResponse } from "../../services/api_service.ts";

export class TenantController {
  private tenantRepo: TenantRepository;
  private userRepo: UserRepository;

  constructor(tenantRepo = new TenantRepository(), userRepo = new UserRepository()) {
    this.tenantRepo = tenantRepo;
    this.userRepo = userRepo;
  }

  public async getUsers (req: HTTPRequest) {
    // TODO: check user permission...
    return makeJSONResponse(await this.userRepo.findUsersByTenant(this.pluckTenant(req)))
  }


  private pluckTenant (req: HTTPRequest): ITenant {
    return req.getData('tenant') as ITenant
  }
}


export function registerTenantController (r: IRouter): IRouter {
  const controller = new TenantController()

  r.get('/users', controller, 'getUsers')

  return r;
}