import { makeUlid } from "../app.ts";
import { toDateOrNull } from "../repository/repository_helper.ts";
import { Tenant } from "./tenant_entity.ts";
import { User } from "./user_entity.ts";

export enum UserTenantStatus {
  INACTIVE = 0, ACTIVE = 1,
}

export enum UserTenantRole {
  ADMIN = 1,
  UPLOADER = 2,
}

export class UserTenant {
  private _user_internal_id = 0;
  private _tenant_internal_id = 0;
  private _status = UserTenantStatus.ACTIVE;
  private _roles = [UserTenantRole.UPLOADER];
  private _token = '';
  private _user: User | undefined = undefined;
  private _tenant: Tenant | undefined = undefined;
  private _created_at = 0;
  private _updated_at = 0;
  private _deleted_at = 0;

  get user_internal_id () {
    return this._user_internal_id
  }

  set user_internal_id (id: number) {
    this._user_internal_id = id;
  }

  get tenant_internal_id () {
    return this._tenant_internal_id
  }

  set tenant_internal_id (id: number) {
    this._tenant_internal_id = id;
  }

  get status () {
    return this._status
  }

  set status (status: UserTenantStatus) {
    this._status = status;
  }

  get roles () {
    return this._roles;
  }

  set roles (roles: UserTenantRole[]) {
    this.addRole(roles)
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

  get statusAsNumber () {
    return this.status === UserTenantStatus.ACTIVE ? 1 : 0;
  }

  public addRole (role: UserTenantRole | UserTenantRole[]) {
    const roles = (Array.isArray(role)) ? role : [role];

    roles.forEach((r) => {
      if (this._roles.indexOf(r) == -1) {
        this._roles.push(r)
      }
    })
  }

  public revokeRole (role: UserTenantRole | UserTenantRole[]) {
    const roles = (Array.isArray(role)) ? role : [role];
    this._roles = this._roles.filter((r) => roles.indexOf(r) === -1)
  }

  get token () {
    return this._token
  }

  getUser () {
    return this._user
  }

  setUser (user: User) {
    this._user = user;
    this._user_internal_id = user.internal_id;
  }

  getTenant () {
    return this._tenant;
  }

  setTenant (tenant: Tenant) {
    this._tenant = tenant;
    this._tenant_internal_id = tenant.internal_id
  }

  refreshToken () {
    const tenant = this.getTenant()
    if (tenant) {
      this._token = `${tenant.id}.${makeUlid()}`
    } else {
      throw Error('tenant internal ID must be set');
    }
  }

  public toJSON () {
    return {
      user: this.getUser(),
      tenant: this.getTenant(),
      token: this.token,
      status: this.status,
      created_at: toDateOrNull(this.created_at),
      updated_at: toDateOrNull(this.updated_at),
      deleted_at: toDateOrNull(this.deleted_at)
    }
  }

  public static fromRecord (record: Record<string, unknown>): UserTenant {
    const obj: UserTenant = new UserTenant();

    // User's internal ID
    if (record.user_internal_id) {
      obj.user_internal_id = record.user_internal_id as number
    }

    // tenant internal ID
    if (record.tenant_internal_id) {
      obj.tenant_internal_id = record.tenant_internal_id as number
    }

    // status
    if (record.status) {
      obj.status = record.status as UserTenantStatus
    }

    // roles
    if (record.roles) {
      if (typeof record.roles === 'string') {
        obj.roles = JSON.parse(record.roles) as UserTenantRole[]
      } else {
        obj.roles = record.roles as UserTenantRole[]
      }
    }

    // token
    if (record.token) {
      obj._token = record.token as string
    }

    // link User entity
    const user = User.fromRecord(obj.pluckUserDataFromResult(record));
    if (user.id) {
      obj.setUser(user)
    }

    // Link Tenant entity
    const tenant = Tenant.fromRecord(obj.pluckTenantDataFromResult(record));
    if (tenant.id) {
      obj.setTenant(tenant);
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

    return obj;
  }

  protected pluckUserDataFromResult (record: Record<string, unknown>): Record<string, unknown> {
    const prefix = 'users_tbl_';
    return this.doRecordPlucking(record, prefix)
  }

  protected pluckTenantDataFromResult (record: Record<string, unknown>): Record<string, unknown> {
    const prefix = 'tenants_tbl_';
    return this.doRecordPlucking(record, prefix)
  }

  protected doRecordPlucking (record: Record<string, unknown>, prefix: string): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const field in record) {
      if (field.indexOf(prefix) === 0) {
        result[field.replace(prefix, '')] = record[field]
      }
    }

    return result;
  }
}