import { FormFile } from "https://deno.land/std@0.119.0/mime/multipart.ts";
import { crypto } from "https://deno.land/std@0.186.0/crypto/mod.ts";

import { HTTPRequest } from "../core/router.ts";
import { UploadResult } from "../core/upload.ts";

export class UploadController {

  public async handleUploadedFile (req: HTTPRequest): Promise<Response> {
    const files = await req.files('files') || []
    const results: Array<UploadResult> = [];

    for (const aFile of files) {
      const name = this.generateName(aFile);

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

  private generateName (file: FormFile): string {
    let ext = file.filename.split('.').pop();
    ext = ext ? `.${ext}` : '';

    return `${crypto.randomUUID()}${ext}`;

  }
}