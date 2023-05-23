import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { SignedUrl } from "../entities/signed_url_entity.ts";
import { APIResponse } from "../services/api_service.ts";
import { getDb } from "../app.ts";
import { Tenant } from "../entities/tenant_entity.ts";

export type SignedUrlCommitResult = Promise<APIResponse<SignedUrl>>;

export class SignedUrlRepository {

  constructor(private sqliteDb: Database = getDb()) { }

  public findUrlsByTenants (tenant: Tenant | number) {

  }

}