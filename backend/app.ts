import { IUploadManager } from "./core/upload.ts"
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { createStatements } from "./setup/sql.ts";
import {
  Generator,
} from "https://deno.land/x/ulideno@v0.2.0/mod.ts";
import { UserRepository } from "./repository/user_repository.ts";
import { TenantRepository } from "./repository/tenant_repository.ts";
import { UserTenantRepository } from "./repository/user_tenant_repository.ts";
import { setupDefaultUserAndTenant } from "./setup/record.ts";

const db = new Database("./storage/data.db");
db.int64 = true;

export const userRepo = new UserRepository();
export const tenantRepo = new TenantRepository();
export const userTenantRepo = new UserTenantRepository();

export function makeUlid (): string {
  const gen = new Generator();
  return (gen.ulid_encoded() as string).toLowerCase();
}


// create db tables
for (const sqlStatement of createStatements) {
  db.exec(sqlStatement)
}

// setup default records
await setupDefaultUserAndTenant(userRepo, tenantRepo, userTenantRepo);

export function getDb () {
  return db;
}


/**
 * Returns the port set in the environment variable: `UPLOAD_SOMETHING_PORT`
 *
 */
export function getAppPort (): number {
  return parseInt(Deno.env.get('UPLOAD_SOMETHING_PORT') || '8080', 10)
}


/**
 * Returns the base URL set in the environment variable: `UPLOAD_SOMETHING_BASE_URL`
 * 
 */
export function generateBaseUrl (): string {
  const port = getAppPort();
  const baseUrl = Deno.env.get('UPLOAD_SOMETHING_BASE_URL') || 'http://localhost';

  return ([80, 443].indexOf(port) > -1) ? baseUrl : `${baseUrl}:${port}`;
}

export function generateFullUrl (name: string): string {
  return `${generateBaseUrl()}/s/${name}`
}

export function getLocalStoragePath (): string {
  return Deno.env.get('UPLOAD_SOMETHING_LOCAL_STORAGE_ROOT') || './uploads';
}


class App {
  private uploadMangers: Map<string, IUploadManager> = new Map();

  public registerUploadManager (name: string, manager: IUploadManager): this {
    this.uploadMangers.set(name, manager);

    return this;
  }

  public getDefaultUploadManagerName (): string {
    return Deno.env.get('UPLOAD_SOMETHING_FILE_MANAGER') || 'memory';
  }

  public getUploadManager (name?: string): IUploadManager {
    name = name || this.getDefaultUploadManagerName();
    return this.uploadMangers.get(name)!
  }
}


export const app = new App()