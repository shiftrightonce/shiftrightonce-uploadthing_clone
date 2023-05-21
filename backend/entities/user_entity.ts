import { makeUlid } from "../app.ts";

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

  get internal_id () {
    return this._internal_id
  }

  set internal_id (id: number) {
    this._internal_id = id;
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

    if (record.internal_id) {
      obj.internal_id = record.internal_id as number
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