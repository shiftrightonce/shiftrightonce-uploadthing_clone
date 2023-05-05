import { HTTPRequest } from "../core/router.ts";

export class ServerController {

  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }


  public async serveFile (req: HTTPRequest) {
    const id = req.param<string>('id') || '';
    let message = 'File not found';

    if (id) {
      const filepath = decodeURIComponent(id);

      try {
        const readableStream = await req.uploadManager?.file(filepath);
        return new Response(readableStream)
      } catch (e) {
        message = e.message;
        console.error(e.message)
      }

    }

    return new Response(message);

  }

}