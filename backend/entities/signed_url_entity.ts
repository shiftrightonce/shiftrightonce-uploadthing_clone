import { makeUlid } from "../app.ts";
import { UploadConstraint, UploadMetadata } from "./upload_entity.ts";

export type SignedUrlId = string | number;

export class SignedUrlConstraint {
  private _size = 0;

  get size () {
    return this._size;
  }

  public toJSON () {
    return {
      size: this.size
    }
  }
}

export class SignedUrlMetadata {
  private _webhook = '';
  private _data: Record<string, unknown> = {};


  public toJSON () {
    return {
      webhook: this._webhook,
      data: this._data
    }
  }
}

export class SignedUrl {
  private _internal_id = 0;
  private _id: SignedUrlId;
  private _author_internal_id = 0;
  private _tenant_internal_id = 0;
  private _version = 1;
  private _constraint: UploadConstraint;
  private _metadata: UploadMetadata;
  private _expire_at: number = Date.now() + 15;
  private _created_at = 0;
  private _updated_at = 0;
  private _deleted_at = 0;
  private _total = 0;

  constructor(id: SignedUrlId = makeUlid()) {
    this._constraint = new UploadConstraint();
    this._metadata = new UploadMetadata();
    this._id = id;
  }

  get internal_id () {
    return this._internal_id;
  }

  get id () {
    return this._id;
  }

  get author_internal_id () {
    return this._author_internal_id;
  }

  get tenant_internal_id () {
    return this._tenant_internal_id;
  }

  get version () {
    return this._version
  }

  get constraint () {
    return this._constraint
  }

  get total () {
    return this._total
  }

  get metadata () {
    return this._metadata
  }

  get expire_at () {
    return this._expire_at;
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


}