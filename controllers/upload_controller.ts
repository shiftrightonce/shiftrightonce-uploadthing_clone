import { FormFile } from "https://deno.land/std@0.119.0/mime/multipart.ts";
import { crypto } from "https://deno.land/std@0.186.0/crypto/mod.ts";

import { HTTPRequest } from "../core/router.ts";

export class UploadController {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  public async handleUploadedFile (req: HTTPRequest): Promise<Response> {
    const files = await req.files('field2') || []
    const results: Array<{ org_name: string, name: string, full_url: string, status: boolean, message?: string }> = [];
    const token = req.getData<string>('token');

    console.log('token', token)

    for (const aFile of files) {
      const name = await this.generateName(aFile);
      const path = `${this.rootDir}/${name}`;
      let status = false;
      let message = '';

      try {
        status = await req.moveFile(aFile, path);
      } catch (e) {
        message = e.message
      }

      results.push({
        org_name: aFile.filename,
        name,
        full_url: `http://localhost:8080/s/${name}`,
        status,
        message
      });
    }

    const res = new Response(JSON.stringify({
      success: true,
      results,
      metadata: JSON.parse(await req.formFieldValue('metadata') || ""),
      ts: Date.now()
    }))

    res.headers.set('content-type', 'application/json');


    return res;
  }


  private async generateName (file: FormFile, prefix = ''): Promise<string> {
    prefix = prefix || Date.now().toString()

    let ext = file.filename.split('.').pop();
    ext = ext ? `.${ext}` : '';

    const buffer = await crypto.subtle.digest(
      "SHA-384",
      new TextEncoder().encode(`${prefix}-${file.filename}`),
    );

    return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('') + ext;

  }
}