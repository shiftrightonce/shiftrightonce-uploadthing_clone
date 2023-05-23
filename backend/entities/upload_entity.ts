export class UploadConstraint {
  private _size = 0;
  private _allow: string[] = [];

  get size () {
    return this._size
  }

  get allow () {
    return this._allow
  }

  public toJSON () {
    return {
      size: this.size,
      allow: this.allow
    }
  }
}

export class UploadMetadata {
  private _webhook = '';
  private _data: Record<string, unknown> = {};


  public toJSON () {
    return {
      webhook: this._webhook,
      data: this._data
    }
  }
}

export class Upload {

}