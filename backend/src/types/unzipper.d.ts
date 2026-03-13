declare module "unzipper" {
  import { Readable } from "stream";
  export function Extract(opts: { path: string }): NodeJS.WritableStream & { promise(): Promise<void> };
}
