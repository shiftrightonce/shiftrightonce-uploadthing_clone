import { generateUserToken } from "../services/auth_service.ts";
import { ITenant, TenantId } from "./tenant_repository.ts";
import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";
import { resolve } from "https://deno.land/std@0.119.0/path/win32.ts";
import { getDb, makeUlid } from "../app.ts";
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";

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

class User implements IUser {
  private _id: UserId;
  private _status: UserStatus = UserStatus.ACTIVE;
  private _isSystemAdmin = false;
  private _name = ''

  constructor(id: UserId = makeUlid()) {
    this._id = id;
  }

  get id () {
    return this._id
  }

  get name () {
    return this._name
  }

  set name (name) {
    this._name = name;
  }

  get status () {
    return this._status
  }

  set status (s: UserStatus) {
    this._status = s
  }

  get statusAsNumber () {
    switch (this.status) {
      case UserStatus.INACTIVE:
        return 0
      case UserStatus.ACTIVE:
        return 1
    }
    return 0
  }

  get isSysAdmin () {
    return this._isSystemAdmin
  }

  set isSysAdmin (isSysAdmin: boolean) {
    this._isSystemAdmin = isSysAdmin;
  }

  get isSystemAdminAsNumber () {
    return this.isSysAdmin ? 1 : true
  }

  public static fromRecord (record: Record<string, unknown>): User {
    let obj: User;

    // ID
    if (record.id) {
      obj = new User(record.id as UserId)
    } else {
      obj = new User()
    }

    // Name
    if (record.name) {
      obj.name = record.name as string
    }

    // status
    if (record.status) {
      obj.status = record.status as UserStatus
    }

    // is system admin
    if (record.system_admin) {
      obj.isSysAdmin = record.system_admin as boolean
    }

    if (record.isSystemAdmin) {
      obj.isSysAdmin = record.isSystemAdmin as boolean
    }

    if (record.is_system_admin) {
      obj.isSysAdmin = record.is_system_admin as boolean
    }

    return obj

  }

  public toJSON () {
    return {
      id: this.id,
      is_system_admin: this.isSysAdmin,
      name: this.name,
      status: this.status
    }
  }
}


const dummyData: IUser[] = [
  new User()
  ,
  new User()
  ,
  new User()
];

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