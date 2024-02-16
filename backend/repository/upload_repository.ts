import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { getDb } from "../app.ts";
import { Upload } from "../entities/upload_entity.ts";
import { APIResponse, ApiError, makeApiFailResponse, makeApiSuccessResponse } from "../services/api_service.ts";

export type UploadCommitResult = Promise<APIResponse<Upload>>

export class UploadRepository {
  private sqliteDb: Database;

  constructor(db?: Database) {
    this.sqliteDb = (db )? db: getDb()
  }


  public async create (entity: Upload): UploadCommitResult {
    return await this.save(entity) 
  }

  public findByName (name: string): UploadCommitResult {
    const sql = "SELECT * from 'uploads' where name = :name";

    return new Promise((resolve, reject) => {
    const result = this.sqliteDb.prepare(sql).get({ name });
      if (result) {
        resolve(makeApiSuccessResponse(Upload.fromRecord(result)));
      } else {
        reject(makeApiFailResponse(new ApiError(`could not find an uploaded file with name: ${name}`)))
      }
    })
  }


  public async save (entity: Upload): UploadCommitResult {
    // TODO: Join the tenant and user records to the query
    const create_sql = `
    INSERT INTO 'uploads' ('id', 'name', 'tenant_internal_id', 'user_internal_id', 'storage', 'uploaded_at') VALUES (:id, :name, :tenant, :user, :storage, :uploaded_at)
    `;

    this.sqliteDb.exec(create_sql, {
      id: entity.id,
      name: entity.name,
      tenant: entity.tenant_internal_id,
      user: entity.user_internal_id,
      storage: entity.storage,
      uploaded_at: entity.updated_at
    });

    return await this.findByName(entity.name)

  }
}