import { FormFile } from "https://deno.land/std@0.119.0/mime/multipart.ts";
import { crypto } from "https://deno.land/std@0.186.0/crypto/mod.ts";

import { HTTPRequest } from "../core/router.ts";
import { UploadResult } from "../core/upload.ts";

export class UploadController {

  public async handleUploadedFile (req: HTTPRequest): Promise<Response> {
    const files = await req.files('files') || []
    const results: Array<UploadResult> = [];

    for (const aFile of files) {
      const name = await this.generateName(aFile);

      try {
        if (req.uploadManager) {
          results.push(await req.uploadManager.save(aFile, name));
        } else {
          results.push({
            success: false,
            name: name,
            full_url: '',
            message: 'No upload manager'
          });
        }
      } catch (e) {
        results.push({
          success: false,
          name: name,
          full_url: '',
          message: e.message
        });
      }
    }


    const res = new Response(JSON.stringify({
      files: results,
      metadata: await this.parseMetadata(req)
    }))

    res.headers.set('content-type', 'application/json');
    return res;
  }


  private async parseMetadata (req: HTTPRequest): Promise<Record<string, unknown>> {
    try {
      return JSON.parse(await req.formFieldValue('metadata') || "")
    } catch (_) {
      return {}
    }
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