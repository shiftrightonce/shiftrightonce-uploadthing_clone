import { serve } from "https://deno.land/std@0.173.0/http/server.ts";
import router from './routes.ts'

const port = 8080;

const handler = async (request: Request): Promise<Response> => {
  return await router.handleRoute(request)
};

console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);
await serve(handler, { port });