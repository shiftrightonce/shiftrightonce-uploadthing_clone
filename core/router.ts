import { IUploadManager } from "./upload.ts";
import { HTTPRequest } from "./request.ts";

export { HTTPRequest } from "./request.ts";

export type Middleware = (req: HTTPRequest, next: (req: HTTPRequest) => Response | Promise<Response>) => Response | Promise<Response>;

export type RouteCallback = ((req: HTTPRequest) => Response | Promise<Response>) | Middleware;
enum HTTP_VERB {
  GET,
  POST,
  PUT,
  DELETE
}
export class Router {
  private routes: Map<HTTP_VERB, Map<string, RouteCallback>>;
  private middleware: Array<Middleware> = [];
  private four0fourHandler: ((req: Request) => Response | Promise<Response>) | undefined;
  private uploadManager: IUploadManager | undefined;

  constructor(uploadManager?: IUploadManager) {
    this.routes = new Map();
    this.routes.set(HTTP_VERB.GET, new Map());
    this.routes.set(HTTP_VERB.POST, new Map());
    this.routes.set(HTTP_VERB.PUT, new Map());
    this.routes.set(HTTP_VERB.DELETE, new Map());

    this.uploadManager = uploadManager;
  }


  public setUploadManager (uploadManager: IUploadManager) {
    this.uploadManager = uploadManager;
  }


  public registerMiddleware (middleware: Middleware): this {
    this.middleware.push(middleware);
    return this;
  }

  public get<T> (route: string, callback: RouteCallback | T, handler?: string): this {
    return this.registerHandler(HTTP_VERB.GET, route, callback, handler);
  }

  public post<T> (route: string, callback: RouteCallback | T, handler?: string): this {
    return this.registerHandler(HTTP_VERB.POST, route, callback, handler);
  }
  public put<T> (route: string, callback: RouteCallback | T, handler?: string): this {
    return this.registerHandler(HTTP_VERB.PUT, route, callback, handler);
  }
  public delete<T> (route: string, callback: RouteCallback | T, handler?: string): this {
    return this.registerHandler(HTTP_VERB.DELETE, route, callback, handler);
  }

  public on404 (callback: (req: Request) => Response | Promise<Response>): this {
    this.four0fourHandler = callback;
    return this;
  }

  private async _doHandling (verb: HTTP_VERB, request: Request) {
    const keys = this.routes.get(verb)?.keys();
    let aRoute = keys?.next();


    while (aRoute && !aRoute.done) {
      const urlPattern = new URLPattern({ pathname: aRoute.value });
      const handler = this.routes.get(verb)?.get(aRoute.value);
      const match = urlPattern.exec(request.url);
      if (match && handler) {
        const middleware = [...this.middleware];
        middleware.push(handler);
        middleware.reverse();
        const rootMiddleware = async (req: HTTPRequest) => {
          const active = middleware.pop();
          if (active) {
            return await active(req, rootMiddleware);
          } else {
            return new Response("");
          }
        }

        return await rootMiddleware(new HTTPRequest(request, match, this.uploadManager));
      }
      aRoute = keys?.next();
    }

    if (this.four0fourHandler) {
      return this.four0fourHandler(request);
    } else {
      return new Response('page not found');
    }
  }

  private registerHandler<T> (verb: HTTP_VERB, route: string, callback: RouteCallback | T, handler?: string): this {
    let builtHandler = callback;

    if (typeof callback !== 'function') {
      if (!handler) {
        throw Error("You need to pass a method to call on the object");
      }
      builtHandler = (req: HTTPRequest) => {
        try {
          return (callback as Record<string, RouteCallback>)[handler](req, (_r) => new Response());
        } catch (e) {
          console.log(`could not handler request: ${e.message}`);
          return new Response("could not handle request", { status: 500 });
        }
      }
    }

    this.routes.get(verb)?.set(route, builtHandler as RouteCallback);
    return this;
  }

  public handleRoute (request: Request): Promise<Response> {
    return new Promise((resolve, reject) => {
      // transform the http verb strings to HTTP_VERB enum
      const transformer: Record<string, HTTP_VERB> = {
        'GET': HTTP_VERB.GET,
        'POST': HTTP_VERB.POST,
        'PUT': HTTP_VERB.PUT,
        'DELETE': HTTP_VERB.DELETE,
        'PATCH': HTTP_VERB.GET
      }
      try {
        resolve((transformer[request.method]) ? this._doHandling(transformer[request.method], request) : this._doHandling(HTTP_VERB.GET, request));
      } catch (e) {
        reject(e)
      }
    })
  }
}