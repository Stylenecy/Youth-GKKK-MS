import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Member } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: Member;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
