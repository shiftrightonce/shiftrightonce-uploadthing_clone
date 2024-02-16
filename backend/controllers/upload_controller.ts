import { FormFile } from "https://deno.land/std@0.119.0/mime/multipart.ts";
import { crypto } from "https://deno.land/std@0.186.0/crypto/mod.ts";

import { HTTPRequest } from "../core/router.ts";
import { UploadResult } from "../core/upload.ts";
import { Upload } from "../entities/upload_entity.ts";
import { UserTenant } from "../entities/user_tenant_entity.ts";
import { UploadRepository } from '../repository/upload_repository.ts'

export class UploadController {

  constructor(private uploadRepo = new UploadRepository()) {}

  public async handleUploadedFile (req: HTTPRequest): Promise<Response> {
    const files = await req.files('files') || []
    const results: Array<UploadResult> = [];

    for (const aFile of files) {
      const name = this.generateName(aFile);

      try {
        if (req.uploadManager) {
          const result = await req.uploadManager.save(aFile, name);
          if (result.success) {
            const userTenant = req.getData('userTenant') as UserTenant;

            const uploadEntity = new Upload();
            uploadEntity.name = result.name;
            uploadEntity.user_internal_id = userTenant.user_internal_id;
            uploadEntity.tenant_internal_id = userTenant.tenant_internal_id;

            const data = await this.uploadRepo.create(uploadEntity);
            if (data.success) {
              result.id = data.data.id as string
            }
          }
          results.push(result);
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