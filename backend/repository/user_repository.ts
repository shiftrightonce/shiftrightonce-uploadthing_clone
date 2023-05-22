import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";
import { getDb, userTenantRepo } from "../app.ts";
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { User } from "../entities/user_entity.ts";
import { Tenant } from "../entities/tenant_entity.ts";
import { DbCursor, Page } from "./repository_helper.ts";
import { UserTenantRole } from "../entities/user_tenant_entity.ts";

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

export type UserCommitResult = APIResponse<User>

export class UserRepository {
  private sqliteDb: Database;

  constructor() {
    this.sqliteDb = getDb()
  }

  public findUserById (id: UserId, withDeleted = false): Promise<APIResponse<User>> {
    let sql: string;

    if (withDeleted) {
      sql = `SELECT * FROM 'users' WHERE id = :id LIMIT 1 `;
    } else {
      sql = `SELECT * FROM 'users' WHERE id = :id AND deleted_at = 0`;
    }

    const result = this.sqliteDb.prepare(sql).get({ id })

    return new Promise((resolve, reject) => {
      try {
        resolve((result) ? makeApiSuccessResponse(User.fromRecord(result)) : makeApiFailResponse(new ApiError('User does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public findUserByInternalId (id: number, withDeleted = false): Promise<APIResponse<User>> {
    let sql: string;

    if (withDeleted) {
      sql = `SELECT * FROM 'users' WHERE internal_id = :id LIMIT 1 `;
    } else {
      sql = `SELECT * FROM 'users' WHERE internal_id = :id AND deleted_at = 0`;
    }

    const result = this.sqliteDb.prepare(sql).get({ id })

    return new Promise((resolve, reject) => {
      try {
        resolve((result) ? makeApiSuccessResponse(User.fromRecord(result)) : makeApiFailResponse(new ApiError('User does not exist')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public fetchDefaultUser (): Promise<UserCommitResult> {
    const sql = `SELECT * FROM  'users' WHERE system_admin = 1 AND status = 1 AND deleted_at = 0 LIMIT 1`;
    return new Promise((resolve, reject) => {
      try {
        const result = this.sqliteDb.prepare(sql).get();
        resolve((result) ? makeApiSuccessResponse(User.fromRecord(result)) : makeApiFailResponse(new ApiError('Default user not found')));
      } catch (error) {
        reject(error)
      }
    });
  }

  public getUsers (withDeleted = false, cursor: string | DbCursor = ''): Promise<APIResponse<{
    cursors: {
      current: string,
      next: string | null,
    }
    , page: IUser[]
  }>> {
    const dbCursor = (typeof cursor === 'string') ? DbCursor.fromString(cursor) : cursor;

    return new Promise((resolve, _reject) => {
      const sql = (withDeleted) ? `SELECT * FROM 'users' WHERE ${dbCursor.toSql()}` : `SELECT * FROM 'users' WHERE deleted_at = 0 AND ${dbCursor.whereSql()} ${dbCursor.orderBySql()} ${dbCursor.limitSql()} `;
      let last = '';

      const results = this.sqliteDb.prepare(sql).all().map((r) => {
        last = r[dbCursor.field] || '';
        return User.fromRecord(r)
      });
      const next = dbCursor.next(results.length, last)?.toEncodedString();
      resolve(makeApiSuccessResponse({
        cursors: {
          current: dbCursor.toEncodedString(),
          next: next || null,
        }, page: results
      }))
    });
  }

  public async createUser (user: User): Promise<UserCommitResult> {
    return await this.saveUser(user);
  }

  public async updateUser (userId: UserId, user: User): Promise<UserCommitResult> {
    const result = await this.findUserById(userId);

    if (result.success) {
      user.internal_id = result.data.internal_id;
      return await this.saveUser(user)
    }

    return result;
  }

  public async softDeleteUser (user: UserId | User): Promise<UserCommitResult> {
    const sql = `UPDATE 'users' SET updated_at = :updated_at, deleted_at = :deleted_at WHERE id= :id`;
    const id = (typeof user === 'object') ? user.id : user;

    const result = await this.findUserById(id)

    if (result.success) {
      const ts = Date.now();
      this.sqliteDb.exec(sql, { id: result.data.id, updated_at: ts, deleted_at: ts });
    }

    return result;
  }

  public async restoreUser (user: UserId | User): Promise<UserCommitResult> {
    const sql = `UPDATE 'users' SET updated_at = :updated_at, deleted_at = 0 WHERE id= :id`;
    const id = (typeof user === 'object') ? user.id : user;
    let result = await this.findUserById(id, true);

    if (result.success) {
      this.sqliteDb.exec(sql, { updated_at: Date.now() });
      result = await this.findUserById(id);
    }

    return result;


  }

  public async hardDeleteUser (user: UserId | User): Promise<UserCommitResult> {
    const sql = `DELETE * FROM 'users' WHERE id = :id `;
    const id = (typeof user === 'object') ? user.id : user;

    const result = await this.findUserById(id)

    if (result.success) {
      this.sqliteDb.exec(sql, { id: result.data.id });
    }

    return result;
  }

  public async createDefaultSystemAdmin (): Promise<UserCommitResult> {
    const user = new User();
    user.name = 'System Default User';
    user.isSysAdmin = true;
    user.status = UserStatus.ACTIVE;

    return await this.sqlCreateUser(user)
  }


  private async sqlCreateUser (user: User): Promise<UserCommitResult> {
    return await this.saveUser(user);
  }

  private saveUser (user: User): Promise<UserCommitResult> {
    const create_sql = `INSERT INTO 'users' ('id', 'name', 'status', 'system_admin', 'created_at') VALUES (:id, :name , :status, :system_admin, :created_at)`;
    const update_sql = `UPDATE 'users' SET 'name' = :name, 'status' = :status, 'system_admin' = :system_admin, updated_at = :updated_at WHERE internal_id = :internal_id`;

    return new Promise((resolve, reject) => {
      let affected = 0;
      try {
        if (user.internal_id) {
          affected = this.sqliteDb.exec(update_sql, {
            name: user.name,
            status: user.statusAsNumber,
            system_admin: user.isSystemAdminAsNumber,
            updated_at: Date.now()
          })
        } else {
          affected = this.sqliteDb.exec(create_sql, {
            id: user.id,
            name: user.name,
            status: user.statusAsNumber,
            system_admin: user.isSystemAdminAsNumber,
            created_at: Date.now()
          })
          resolve((affected) ? this.findUserById(user.id) : makeApiFailResponse(new ApiError(user.internal_id ? 'Could not save user' : 'Could not update user')))
        }
      } catch (error) {
        reject(error)
      }
    });
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