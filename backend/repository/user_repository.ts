import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";
import { getDb } from "../app.ts";
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { User } from "../entities/user_entity.ts";
import { findOneSystemAdmin } from "../setup/sql.ts";
import { ITenant, TenantId } from "../entities/tenant_entity.ts";

export type UserId = string | number;

export enum UserStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

export interface IUser {
  id?: UserId,
  name: string,
  status: UserStatus,
  isSysAdmin: boolean
}

const dummyData: IUser[] = []

export type UserCommitResult = APIResponse<IUser>

export class UserRepository {
  private sqliteDb: Database;

  constructor() {
    this.sqliteDb = getDb()
  }

  public async findUserByToken (token: string): Promise<APIResponse<IUser>> {
    const user = dummyData.filter((u) => u.id === token).pop();
    return (user) ? makeApiSuccessResponse(user) : makeApiFailResponse(new ApiError('User does not exist'))
  }

  public async findUserById (id: UserId): Promise<APIResponse<IUser>> {
    const sql = `SELECT * FROM 'users' WHERE id = :id  LIMIT 1 `;
    const result = this.sqliteDb.prepare(sql).get({ id })

    return (result) ? makeApiSuccessResponse(User.fromRecord(result)) : makeApiFailResponse(new ApiError('User does not exist'))
  }

  public async fetchDefaultUser (): Promise<UserCommitResult> {
    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(findOneSystemAdmin).get({ system_admin: 1 });
        resolve((result) ? makeApiSuccessResponse(User.fromRecord(result)) : makeApiFailResponse(new ApiError('Default user not found')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public async findUsersByTenant (_tenant: TenantId | ITenant, _limit = 250): Promise<APIResponse<IUser[]>> {
    return new Promise((resolve, _reject) => {
      resolve(makeApiSuccessResponse([...dummyData]))
    })
  }

  public getUsers (_limit = 250): Promise<APIResponse<IUser[]>> { // TODO: Do some sort of pagination
    return new Promise((resolve, _reject) => {
      const sql = `SELECT * FROM 'users'`
      const results = this.sqliteDb.prepare(sql).all().map((r) => User.fromRecord(r));
      resolve(makeApiSuccessResponse(results))
    });
  }

  public createUser (user: IUser, tenant: ITenant): Promise<UserCommitResult> {

    return new Promise((resolve, _reject) => {
      user.id = crypto.randomUUID();
      // user.token = generateUserToken(tenant);
      dummyData.push(user) // TODO: DB action
      resolve(makeApiSuccessResponse(user))
    })
  }

  public async updateUser (userId: UserId, user: IUser): Promise<UserCommitResult> {
    const { user: existingUser, index: userIndex } = await this.pluckUser(userId) // TODO: DB action
    return new Promise((resolve, _reject) => {
      if (existingUser) {
        for (const field in user) {
          if (field === 'id') {
            existingUser[field] = user[field];
          }

          existingUser.id = userId
        }

        // store changes
        dummyData[userIndex] = existingUser;
        return resolve(makeApiSuccessResponse(existingUser))
      }
      return resolve(makeApiFailResponse(new ApiError(`User '${userId}' does not exist`)))
    });
  }

  public async deleteUser (user: UserId | IUser): Promise<UserCommitResult> {
    const id = (typeof user === 'object') ? user.id : user;
    const { user: existingUser, index: userIndex } = await this.pluckUser(id as UserId)
    return new Promise((resolve, _reject) => {
      if (existingUser) {
        dummyData.splice(userIndex, 1); // TODO: DB action
        resolve(makeApiSuccessResponse(existingUser))
      }
      resolve(makeApiFailResponse(new ApiError(`User '${id}' does not exist`)))
    });
  }

  public async createDefaultSystemAdmin (): Promise<UserCommitResult> {
    const user = new User();
    user.name = 'System Default User';
    user.isSysAdmin = true;
    user.status = UserStatus.ACTIVE;

    return await this.sqlCreateUser(user)
  }


  private async sqlCreateUser (user: User): Promise<UserCommitResult> {

    const sql = `INSERT INTO 'users'
        ('id', 'name', 'status', 'system_admin')
        VALUES (:id, :name , :status, :system_admin)`


    return new Promise((resolve, reject) => {
      const affected = this.sqliteDb.exec(sql, {
        id: user.id,
        name: user.name,
        status: user.statusAsNumber,
        system_admin: user.isSystemAdminAsNumber
      })

      if (affected) {
        this.findUserById(user.id).then((resp) => resolve(resp)).catch(reject)
      } else {
        resolve(makeApiFailResponse(new ApiError('Could not create user')))
      }
    })
  }

  private pluckUser (userId: UserId): Promise<{ user?: IUser, index: number }> {
    const result: { user?: IUser, index: number } = {
      index: -1
    };
    return new Promise((resolve, _reject) => {
      const _ = dummyData.filter((u, index) => {
        if (u.id == userId) {
          result.index = index
          result.user = { ...u }
          return true
        }
        return false
      });
      resolve(result)
    });
  }
}