import { ParsedQs } from "qs";
import { IJWTPayload } from "./index";

/**
 * Augments Express's Request type with the `user` property set by the
 * `auth` middleware once a request's JWT has been verified.
 *
 * Before this, every controller that needed a typed `req.user` had to
 * redeclare the same `Request & { user?: IJWTPayload }` intersection type
 * locally (repeated across 19+ files) — and the one place that actually
 * *sets* req.user (middlewares/auth.ts) wasn't even using that type, just
 * `any`. This makes `req.user: IJWTPayload | undefined` available on every
 * `Request` throughout the app without any per-file boilerplate.
 *
 * Existing local `Request & { user?: IJWTPayload }` annotations elsewhere
 * remain valid (they just redundantly restate what's now global) — there's
 * no need to touch them, though new code shouldn't need to add its own.
 */
type QueryValue = string | string[] | ParsedQs | ParsedQs[] | undefined;

export type ApiQuery = Partial<Record<string, QueryValue>>;

// Express's query type is intentionally broad; the API only forwards the
// allow-listed query values returned by `pick()` to service-layer filters.
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
      query: ApiQuery;
    }
  }
}

export {};
