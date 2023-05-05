import { MultipartReader } from "https://deno.land/std@0.119.0/mime/mod.ts";
import { FormFile, MultipartFormData } from "https://deno.land/std@0.119.0/mime/multipart.ts";
import { readerFromStreamReader, copy } from "https://deno.land/std@0.186.0/streams/mod.ts";
import { IUploadManager } from "./upload.ts";

export class HTTPRequest {
  private _req: Request;
  private _params: Record<string, unknown> = {}
  private _form: MultipartFormData | null = null;
  private _query: URLSearchParams;
  private _data: Map<string, unknown> = new Map()
  private _uploadManager: IUploadManager | undefined;

  private isMultipartForm = false;
  private isForm = true;

  constructor(req: Request, match: URLPatternResult, upload_manager?: IUploadManager) {
    this._req = req;
    this._params = match.pathname.groups;

    const contentType = req.headers.get('content-type') || '';
    this.isMultipartForm = contentType.indexOf('multipart/form-data') > -1;

    this._query = new URLSearchParams(this._req.url.split("?").pop() || '');
    this._uploadManager = upload_manager;
  }

  public async form (): Promise<MultipartFormData | null> {
    void await this.initForm()
    return this._form;
  }

  get headers () {
    return this._req.headers
  }

  get query () {
    return this._query;
  }

  get req () {
    return this._req;
  }

  get body () {
    return this._req.body;
  }

  get uploadManager () {
    return this._uploadManager;
  }

  public getData<T> (key: string): T | undefined {
    return this._data.get(key) as T
  }
  public addData (key: string, v: unknown) {
    this._data.set(key, v)
  }

  get params () {
    return this._params;
  }

  public async files (key: string): Promise<Array<FormFile> | undefined> {
    void await this.initForm()
    if (this._form) {
      return this._form.files(key)
    }

    return undefined;
  }

  public async file (key: string): Promise<FormFile | undefined> {
    const files = await this.files(key);
    return (files) ? files.pop() : undefined;
  }

  public async moveFileByName (name: string, destination: string): Promise<boolean> {
    const files = await this.files(name) || [];
    for (const aFile of files) {
      await this.moveFile(aFile, destination, true)
    }

    return true;
  }

  public async moveFile (file: FormFile, destination: string, useFileName = false): Promise<boolean> {
    const name = (useFileName) ? `/${file.filename}` : '';
    const des = await Deno.open(`${destination}${name}`, { write: true, create: true });

    if (file?.content) {
      des.write(file.content);
    } else if (file?.tempfile) {
      const tempFile = await Deno.open(file.tempfile, { read: true })
      await copy(tempFile, des);
      Deno.remove(file.tempfile);
    }

    des.close();

    return true;
  }

  public async formFieldValues<T> (key: string): Promise<Array<T> | undefined> {
    void await this.initForm()
    if (this._form) {
      return this._form.values(key) as Array<T>
    }
    return undefined;
  }

  public async formFieldValue<T> (key: string): Promise<T | undefined> {
    const values = await this.formFieldValues<T>(key)
    if (values) {
      return values.pop()
    }
    return undefined;
  }


  public param<T> (key: string): T | undefined {
    return (this._params[key] as T) || undefined;
  }

  private async initForm () {

    if (this.isMultipartForm && !this._form) {
      const contentType = this._req.headers.get('content-type') || "";
      const boundary = contentType.split('boundary=').pop() || "";
      const bodyReader = this._req.body?.getReader();
      if (bodyReader) {
        const reader = readerFromStreamReader(bodyReader);
        this._form = await new MultipartReader(reader, boundary).readForm();
      }
    }

  }
}