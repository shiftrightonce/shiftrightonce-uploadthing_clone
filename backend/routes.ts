import { ServerController } from "./controllers/server_controller.ts";
import { UploadController } from "./controllers/upload_controller.ts";
import { HTTPRequest, Router, } from "./core/router.ts";
import { getAccessToken } from "./services/auth_service.ts";

const router = new Router();

// router.registerMiddleware((req, next) => {
//   console.log('middleware 1', req._params);
//   return next(req)
// })

// router.registerMiddleware((req, next) => {
//   console.log('middleware 2');
//   return next(req)
// })


router.registerMiddleware((req, next) => {
  const token = getAccessToken(req);
  req.addData('token', token);

  // TODO: Authenticate ???

  return next(req)
})


// general
router.get("/", (_req: HTTPRequest) => {
  const response = new Response('<h1>Home Page</h1>');
  response.headers.set('content-type', 'text/html');

  return response;
})

// registration


const uploadController = new UploadController();
const serverController = new ServerController();

// uploading
router.post("/v1/f", uploadController, 'handleUploadedFile');

// serving
router.get('/s/:id', serverController, 'serveFile');


// system wide
router.on404((_req: Request) => {
  const response = new Response('<h1>this is a custom 404 handler!!!</h1>');

  response.headers.set('content-type', 'text/html');

  return response;
})


export default router;