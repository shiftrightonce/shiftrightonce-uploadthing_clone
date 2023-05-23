import { makeUlid, maxFileSize } from "../app.ts";
import { toDateOrNull } from "../repository/repository_helper.ts";
import { Tenant } from "./tenant_entity.ts";
import { User } from "./user_entity.ts";

export class UploadConstrain {
  private _storage = 'default';

  constructor(private _size = maxFileSize) { }

  get size () {
    return this._size
  }

  set size (size: number) {
    this._size = size;
  }

  get storage () {
    return this._storage;
  }

  set storage (storage: string) {
    this._storage = storage;
  }


  public static fromRecord (record: Record<string, unknown>): UploadConstrain {
    const obj = new UploadConstrain();

    if (record.size) {
      obj.size = record.size as number
    }

    if (record.storage) {
      obj.storage = record.storage as string
    }

    return obj;
  }

  public toJSON () {
    return {
      size: this.size
    }
  }
}

export class UploadMetadata {
  private _webhook: string | null = null;
  private _data: Record<string, unknown> | null = null;

  get webhook () {
    return this._webhook;
  }

  set webhook (webhook: string | null) {
    this._webhook = webhook;
  }

  get data () {
    return this._data;
  }

  set data (data: Record<string, unknown> | null) {
    this._data = data;
  }

  public static fromRecord (record: Record<string, unknown>): UploadMetadata {
    const obj = new UploadMetadata();

    if (record.webhook) {
      obj.webhook = record.webhook as string;
    }

    if (record.data) {
      obj.data = (typeof record.data === 'string') ? JSON.parse(record.data) : record.data;
    }


    return obj;
  }

  public toJSON () {
    return {
      webhook: this.webhook,
      data: this.data
    }
  }
}

export type UploadId = string | number;

export class Upload {
  private _internal_id = 0;
  private _storage = 'default';
  private _user_internal_id = 0;
  private _tenant_internal_id = 0;
  private _uploaded_at = 0;
  private _user: User | null = null;
  private _tenant: Tenant | null = null;

  constructor(private _id: UploadId = makeUlid()) { }


  get internal_id () {
    return this._internal_id;
  }

  set internal_id (id: number) {
    this._internal_id = id;
  }

  get id () {
    return this._id;
  }

  set id (id: UploadId) {
    this._id = id;
  }

  get storage () {
    return this._storage;
  }

  set storage (s: string) {
    this._storage = s;
  }

  get updated_at () {
    return this._uploaded_at;
  }

  set uploaded_at (at: number) {
    this._uploaded_at = at;
  }

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


  public getUser () {
    return this._user
  }

  public setUser (user: User) {
    this._user = user;
    this._user_internal_id = user.internal_id;
  }

  public getTenant () {
    return this._tenant;
  }

  public setTenant (tenant: Tenant) {
    this._tenant = tenant;
    this._tenant_internal_id = tenant.internal_id
  }

  public toJSON () {
    return {
      user: this.getUser(),
      tenant: this.getTenant(),
      id: this.id,
      storage: this.storage,
      uploaded_at: toDateOrNull(this.updated_at)
    }
  }


  public static fromRecord (record: Record<string, unknown>): Upload {
    const obj = new Upload();

    // internal ID
    if (record.user_internal_id) {
      obj.user_internal_id = record.user_internal_id as number;
    }

    // id
    if (record.id) {
      obj.id = record.id as string;
    }

    // tenant internal ID
    if (record.tenant_internal_id) {
      obj.tenant_internal_id = record.tenant_internal_id as number;
    }

    // user internal ID
    if (record.user_internal_id) {
      obj.user_internal_id = record.user_internal_id as number;
    }

    // storage
    if (record.storage) {
      obj.storage = record.storage as string;
    }

    // uploaded at
    if (record.uploaded_at) {
      obj.uploaded_at = record.uploaded_at as number;
    }


    // Link Tenant entity
    const tenant = Tenant.fromRecord(obj.pluckTenantDataFromResult(record));
    if (tenant.id) {
      obj.setTenant(tenant);
    }


    // link User entity
    const user = User.fromRecord(obj.pluckUserDataFromResult(record));
    if (user.id) {
      obj.setUser(user)
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