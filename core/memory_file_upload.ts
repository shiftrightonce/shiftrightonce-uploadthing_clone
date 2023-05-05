import { readerFromStreamReader, readableStreamFromIterable } from "https://deno.land/std@0.186.0/streams/mod.ts";
import { FormFile } from "https://deno.land/std@0.119.0/mime/multipart.ts";
import { IUploadManager, UploadResult } from "./upload.ts";
import { generateFullUrl } from "../app.ts";


/**
 * An in memory implementation of the upload manager
 * 
 * This implementation can be use when developing
 * 
 */
export class InMemoryUploadManager implements IUploadManager {
  private storage: Map<string, Uint8Array> = new Map();

  public async save (file: FormFile, name?: string | undefined): Promise<UploadResult> {
    const fileName = name || file.filename;
    if (file.content) {
      this.storage.set(fileName, file.content);
    } else if (file.tempfile) {
      const tempFile = await Deno.open(file.tempfile, { read: true })

      const des = new Uint8Array();
      const reader = readerFromStreamReader(tempFile.readable.getReader());
      reader.read(des);
      this.storage.set(fileName, des);
    }


    return {
      name: fileName,
      success: true,
      full_url: generateFullUrl(fileName)
    }
  }

  public file (name: string): Promise<ReadableStream<Uint8Array>> {
    return new Promise((resolve, reject) => {
      const file = this.storage.get(name);

      if (file) {
        resolve(readableStreamFromIterable([file]));
      } else {
        reject(new Error(`File "${name}" does not exist`))
      }

    })
  }

}