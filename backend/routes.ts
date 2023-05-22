import { registerAdminTenantRoutes } from "./controllers/admin/admin_tenant_controller.ts";
import { registerAdminUserRoutes } from "./controllers/admin/admin_user_controller.ts";
import { ServerController } from "./controllers/server_controller.ts";
import { registerTenantController } from "./controllers/tenant/tenant_controller.ts";
import { UploadController } from "./controllers/upload_controller.ts";
import { HTTPRequest, RouteManager } from "./core/router.ts";
import { UserTenant } from "./entities/user_tenant_entity.ts";
import { canUpload, fetchUserTenant, getAccessToken, isAdmin, isSysAdmin, makePermissionDeniedResponse } from "./services/auth_service.ts";

const router = new RouteManager();

async function enrichRequest (req: HTTPRequest): Promise<UserTenant | false> {
  const token = getAccessToken(req);
  const userTenant = await fetchUserTenant(token);

  req.addData('token', token);
  req.addData('userTenant', userTenant);

  return userTenant;

}

// general
router.get("/", (_req: HTTPRequest) => {
  const response = new Response('<h1>Home Page</h1>');
  response.headers.set('content-type', 'text/html');

  return response;
})


const uploadController = new UploadController();
const serverController = new ServerController();

// // admin routes
router.group('/v1/admin', (r) => {
  registerAdminTenantRoutes(r);
  registerAdminUserRoutes(r);
}).registerMiddleware(async (req, next) => {
  return (isSysAdmin(await enrichRequest(req))) ? next(req) : makePermissionDeniedResponse();
});

// tenant routes
router.group('/v1/t', (r) => {
  registerTenantController(r)
}).registerMiddleware(async (req, next) => {
  return (isAdmin(await enrichRequest(req))) ? next(req) : makePermissionDeniedResponse();
})


// uploading
router.post("/v1/f", uploadController, 'handleUploadedFile').registerMiddleware(async (req, next) => {
  return (canUpload(await enrichRequest(req))) ? next(req) : makePermissionDeniedResponse();
});

// serving
router.get('/s/:id', serverController, 'serveFile');


// system wide
router.on404((_req: Request) => {
  const response = new Response('<h1>this is a custom 404 handler!!!</h1>');

  response.headers.set('content-type', 'text/html');

  return response;
})


export default router;