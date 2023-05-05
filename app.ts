import { InMemoryUploadManager } from "./core/memory_file_upload.ts";
import { IUploadManager } from "./core/upload.ts"

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