import { makeUlid } from "../app.ts";
import { Tenant } from "./tenant_entity.ts";
import { User } from "./user_entity.ts";

export enum UserTenantStatus {
  INACTIVE = 0, ACTIVE = 1,
}

export enum UserTenantRole {
  ADMIN = 1,
  UPLOADER = 2,
}


export interface IUserTenant {
  user?: User,
  tenant?: Tenant,
  user_internal_id: number,
  tenant_internal_id: number,
  status: UserTenantStatus
  roles: UserTenantRole[],
  token: string
}

export class UserTenant implements IUserTenant {
  private _user_internal_id = 0;
  private _tenant_internal_id = 0;
  private _status = UserTenantStatus.ACTIVE;
  private _roles = [UserTenantRole.UPLOADER];
  private _token = '';
  private _user: User | undefined = undefined;
  private _tenant: Tenant | undefined = undefined;

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
    if (!this._user && this.user_internal_id) {
      // TODO: FETCH User 
    }

    return this._user
  }

  setUser (user: User) {
    this._user = user;
    this._user_internal_id = user.internal_id;
  }

  getTenant () {
    if (!this._tenant && this._tenant_internal_id) {
      // TODO: Fetch Tenant
    }

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
      status: this.status
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
      obj.roles = record.roles as UserTenantRole[]
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