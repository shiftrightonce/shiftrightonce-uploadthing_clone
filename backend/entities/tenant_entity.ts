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

  public toJSON () {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      is_default: this.is_default
    }
  }

  public static fromRecord (record: Record<string, unknown>): Tenant {
    let obj: Tenant;

    if (record.id) {
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
      obj.status = record.status as TenantStatus
    }

    // internal id
    if (record.internal_id) {
      obj.internal_id = record.internal_id as number;
    }

    // is default
    if (record.is_default) {
      obj.is_default = (record.is_default === 0) ? false : true;
    }

    return obj;
  }
}