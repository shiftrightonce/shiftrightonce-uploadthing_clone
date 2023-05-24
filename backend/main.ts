import { serve } from "https://deno.land/std@0.173.0/http/server.ts";
import "https://deno.land/std@0.186.0/dotenv/load.ts";
import { app, generateBaseUrl, getAppPort, getLocalStoragePath } from "./app.ts";
import { LocalFsFileUpload } from "./core/local_fs_file_upload.ts";
import router from './routes.ts'
import { InMemoryUploadManager } from "./core/memory_file_upload.ts";
import { makeHttpResponse } from "./core/response.ts";


// register upload managers
app.registerUploadManager('local', new LocalFsFileUpload(getLocalStoragePath()));                    // files will be stored to local disk
app.registerUploadManager('memory', new InMemoryUploadManager());                          // files will be stored in memory 



// use default upload manager
router.setUploadManager(app.getUploadManager());


const handler = async (request: Request): Promise<Response> => {
  try {
    return await router.handleRoute(request)
  } catch (e) {
    console.error(`Server error: ${e.message}`, e.stack);
    return makeHttpResponse('Server Error');
  }
};

console.log(`HTTP webserver running. Access it at: ${generateBaseUrl()}`);
console.log(`default file storage: ${app.getDefaultUploadManagerName()}`);

const port = getAppPort();
await serve(handler, { port });