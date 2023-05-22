import { makeUlid } from "../app.ts";

export interface ITenant {
  name: string,
  id: TenantId,
  status: TenantStatus
  is_default: boolean
}

export type TenantId = string | number;

export enum TenantStatus {
  INACTIVE = 0,
  ACTIVE = 1
}


export class Tenant implements ITenant {
  private _id: TenantId;
  private _status = TenantStatus.ACTIVE;
  private _name = '';
  private _internal_id = 0;
  private _is_default = false;
  private _created_at = 0;
  private _updated_at = 0;
  private _deleted_at = 0;

  constructor(id: TenantId = makeUlid()) {
    this._id = id;
  }

  get id () {
    return this._id;
  }

  get name () {
    return this._name;
  }

  set name (name: string) {
    this._name = name;
  }

  get status () {
    return this._status
  }

  set status (status: TenantStatus) {
    this._status = status;
  }

  get internal_id () {
    return this._internal_id
  }

  set internal_id (id: number) {
    this._internal_id = id;
  }

  get is_default () {
    return this._is_default;
  }

  set is_default (d: boolean) {
    this._is_default = d
  }

  get is_default_as_number () {
    return (this.is_default) ? 1 : 0
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


  public merge (tenant: Tenant) {
    Tenant.fromRecord(tenant.toJSON(), this)
  }

  public toJSON () {
    return {
      id: this.id,
      name: this.name,
      status: (this.status === TenantStatus.ACTIVE) ? 'active' : 'inactive',
      is_default: this.is_default,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at
    }
  }

  public static fromRecord (record: Record<string, unknown>, base: Tenant | undefined = undefined): Tenant {
    let obj: Tenant;

    if (base) {
      obj = base;
    } else if (record.id) {
      obj = new Tenant(record.id as TenantId)
    } else {
      obj = new Tenant()
    }

    // Name
    if (record.name) {
      obj.name = record.name as string;
    }

    // status
    if (record.status) {
      if (!isNaN(record.status as number)) {
        obj.status = record.status ? TenantStatus.ACTIVE : TenantStatus.INACTIVE;
      } else {
        switch ((record.status as string).toLowerCase()) {
          case 'active':
            obj.status = TenantStatus.ACTIVE;
            break;
          case 'inactive':
          case 'disable':
            obj.status = TenantStatus.INACTIVE;
            break;
        }
      }
    }

    // internal id
    if (record.internal_id) {
      obj.internal_id = record.internal_id as number;
    }

    // is default
    if (record.is_default) {
      if (typeof record.is_default === 'boolean') {
        obj.is_default = record.is_default;
      } else {
        obj.is_default = (record.is_default === 0) ? false : true;
      }
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
}