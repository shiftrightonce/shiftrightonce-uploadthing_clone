import { makeUlid } from "../app.ts";
import { toDateOrNull } from "../repository/repository_helper.ts";

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

export class User implements IUser {
  private _id: UserId;
  private _status: UserStatus = UserStatus.ACTIVE;
  private _isSystemAdmin = false;
  private _name = ''
  private _internal_id = 0;
  private _created_at = 0;
  private _updated_at = 0;
  private _deleted_at = 0;

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
    return this.isSysAdmin ? 1 : 0
  }

  get internal_id () {
    return this._internal_id
  }

  set internal_id (id: number) {
    this._internal_id = id;
  }

  get created_at () {
    return this._created_at;
  }

  get updated_at () {
    return this._updated_at
  }

  get deleted_at () {
    return this._deleted_at;
  }

  public merge (user: User) {
    User.fromRecord(user.toJSON(), this)
  }

  public static fromRecord (record: Record<string, unknown>, base: User | undefined = undefined): User {
    let obj: User;

    if (base) {
      obj = base;
    } else if (record.id) {
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
      if (!isNaN(record.status as number)) {
        obj.status = record.status ? UserStatus.ACTIVE : UserStatus.INACTIVE;
      } else {
        switch ((record.status as string).toLowerCase()) {
          case 'active':
            obj.status = UserStatus.ACTIVE;
            break;
          case 'inactive':
          case 'disable':
            obj.status = UserStatus.INACTIVE;
            break;
        }
      }
    }

    // is system admin
    if (record.system_admin) {
      obj.isSysAdmin = record.system_admin ? true : false;
    }

    if (record.isSystemAdmin) {
      obj.isSysAdmin = record.isSystemAdmin ? true : false
    }

    if (record.is_system_admin) {
      obj.isSysAdmin = (record.is_system_admin) ? true : false
    }

    if (record.internal_id) {
      obj.internal_id = record.internal_id as number
    }

    // created at
    if (record.created_at) {
      obj._created_at = record.created_at as number;
    }

    // updated at
    if (record.updated_at) {
      obj._updated_at = record.updated_at as number;
    }

    // deleted at
    if (record.deleted_at) {
      obj._deleted_at = record.deleted_at as number;
    }

    return obj

  }

  public toJSON () {
    return {
      id: this.id,
      is_system_admin: this.isSysAdmin,
      name: this.name,
      status: (this.status === UserStatus.ACTIVE) ? 'active' : 'inactive',
      created_at: toDateOrNull(this.created_at),
      updated_at: toDateOrNull(this.updated_at),
      deleted_at: toDateOrNull(this.deleted_at)
    }
  }
}