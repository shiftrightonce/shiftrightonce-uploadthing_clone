import { userRepo } from "../../app.ts";
import { HTTPRequest } from "../../core/request.ts";
import { makeJSONResponse } from "../../core/response.ts";
import { IRouter } from "../../core/router.ts";
import { IUser, UserId, UserRepository } from "../../repository/user_repository.ts";
import { ApiError, makeApiFailResponse } from "../../services/api_service.ts";

export class AdminUserController {
  private userRepo: UserRepository;

  constructor(repo = new UserRepository()) {
    this.userRepo = repo
  }

  public async getUsers (_request: HTTPRequest) {
    const response = makeJSONResponse(await this.userRepo.getUsers());
    return response
  }

  public async getUserById (request: HTTPRequest) {
    return makeJSONResponse(await this.userRepo.findUserById(request.param('id') as UserId));
  }

  public async create (request: HTTPRequest) {
    const data = await request.req.json();
    const result = await this.userRepo.createUser(data as IUser, { id: 1234, name: 'fake tenant' })

    const response = makeJSONResponse(result);
    return response
  }

  public async update (request: HTTPRequest) {
    const data = await request.req.json();
    const id = request.param<UserId>('id') || false;

    if (id) {
      return makeJSONResponse(await this.userRepo.updateUser(id, data as IUser));
    }

    return makeJSONResponse(makeApiFailResponse(new ApiError('ID does not exist')));
  }
  public async deleteUser (request: HTTPRequest) {
    const id = request.param<UserId>('id') || false;
    if (id) {
      return makeJSONResponse(await this.userRepo.deleteUser(id));
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
  router.delete('users/:id', controller, 'deleteUser');

  return router;
}