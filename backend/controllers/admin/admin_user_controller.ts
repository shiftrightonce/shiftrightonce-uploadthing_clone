import { userRepo } from "../../app.ts";
import { HTTPRequest } from "../../core/request.ts";
import { makeJSONResponse } from "../../core/response.ts";
import { IRouter } from "../../core/router.ts";
import { User } from "../../entities/user_entity.ts";
import { DbCursor } from "../../repository/repository_helper.ts";
import { UserId, UserRepository } from "../../repository/user_repository.ts";
import { ApiError, makeApiFailResponse } from "../../services/api_service.ts";

export class AdminUserController {
  private userRepo: UserRepository;

  constructor(repo = new UserRepository()) {
    this.userRepo = repo
  }

  public async getUsers (request: HTTPRequest) {
    const cursor = DbCursor.fromHttpRequest(request) || '';
    const withDeleted = (request.query.get('delete')) ? true : false;

    return makeJSONResponse(await this.userRepo.getUsers(withDeleted, cursor));
  }

  public async getUserById (request: HTTPRequest) {
    const withDeleted = (request.query.get('delete')) ? true : false;

    return makeJSONResponse(await this.userRepo.findUserById(request.param('id') as UserId, withDeleted));
  }

  public async create (request: HTTPRequest) {
    const data = User.fromRecord(await request.req.json());
    const result = await this.userRepo.createUser(data)

    const response = makeJSONResponse(result);
    return response
  }

  public async update (request: HTTPRequest) {
    const id = request.param<UserId>('id') || false;
    const data = User.fromRecord({ ...await request.req.json(), id });

    if (id) {
      return makeJSONResponse(await this.userRepo.updateUser(id, data));
    }

    return makeJSONResponse(makeApiFailResponse(new ApiError('ID does not exist')));
  }

  public async restore (request: HTTPRequest) {
    const id = request.param<UserId>('id') || 0;

    return makeJSONResponse(await this.userRepo.restoreUser(id));
  }

  public async deleteUser (request: HTTPRequest) {
    const id = request.param<UserId>('id') || false;
    if (id) {
      return makeJSONResponse(await this.userRepo.softDeleteUser(id));
    }

    return makeJSONResponse(makeApiFailResponse(new ApiError('ID does not exist')));
  }

  public async hardDeleteUser (request: HTTPRequest) {
    const id = request.param<UserId>('id') || false;
    if (id) {
      return makeJSONResponse(await this.userRepo.hardDeleteUser(id));
    }

    return makeJSONResponse(makeApiFailResponse(new ApiError('ID does not exist')));
  }
}


export function registerAdminUserRoutes (router: IRouter): IRouter {
  const controller = new AdminUserController(userRepo);

  router.get('users', controller, 'getUsers');
  router.get('users/:id', controller, 'getUserById');
  router.post('users', controller, 'create');
  router.put('users/:id', controller, 'update');
  router.put('users/restore/:id', controller, 'update');
  router.delete('users/:id', controller, 'deleteUser');
  router.delete('users/hard-delete/:id', controller, 'hardDeleteUser');

  return router;
}