import { FormFile } from "https://deno.land/std@0.119.0/mime/multipart.ts";
import { IUploadManager, UploadResult } from "./upload.ts";
import { copy } from "https://deno.land/std@0.186.0/streams/mod.ts";
import { generateFullUrl } from "../app.ts";

export class LocalFsFileUpload implements IUploadManager {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  public async save (file: FormFile, name?: string | undefined): Promise<UploadResult> {
    const fileName = name || file.filename;
    const des = await Deno.open(`${this.rootDir}/${fileName}`, { write: true, create: true });
    let success = true;
    let message = '';

    try {
      if (file.content) {
        des.write(file.content);
      } else if (file.tempfile) {
        const tempFile = await Deno.open(file.tempfile, { read: true })
        await copy(tempFile, des);
      }

    } catch (e) {
      success = false;
      message = e.message;
    }

    return {
      success,
      name: fileName,
      message,
      full_url: generateFullUrl(fileName)
    }

  }

  public async file (name: string): Promise<ReadableStream<Uint8Array>> {
    const file = await Deno.open(this.rootDir + '/' + name, { read: true });
    return file.readable;
  }

}