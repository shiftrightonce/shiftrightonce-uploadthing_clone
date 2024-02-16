import { FormFile } from "https://deno.land/std@0.119.0/mime/multipart.ts";

export type UploadResult = {
  id?: string              // The database ID for the upload
  success: boolean,       // Flag indicating the action result
  name: string,           // The final name of the file
  full_url: string,       // Full URL to access the file (readonly)
  message?: string        // If `success` is false, this field must have a message...
};



/**
 * Mangers that persist uploaded files must implement this interface
 * 
 */
export interface IUploadManager {

  /**
   * Save the uploaded file to a cool storage
   * 
   * Example implementation this interface:
   *  - memory_file_upload.ts
   *  - local_fs_file_upload.ts
   * 
   */
  save: (file: FormFile, name?: string) => Promise<UploadResult>,

  /**
   * Provides a readable stream for the file with the name specified
   * 
   */
  file: (name: string) => Promise<ReadableStream>
}

