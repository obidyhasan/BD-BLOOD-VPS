import { ParsedQs } from "qs";

/**
 * Generic dynamic query-filter bag produced by `pick(req.query, filterableFields)`
 * at the controller layer and passed straight through to a module's `getAllX()`
 * service function.
 *
 * Declared structurally identical to Express's `qs.ParsedQs` (rather than
 * importing `ParsedQs` from "qs" directly) so it matches whatever `pick()`
 * actually returns from `req.query` without adding a new module dependency
 * to this file. This is a single shared type rather than one hand-written
 * interface per module because every `getAllX()` in this codebase builds its
 * Prisma `where` clause dynamically from `Object.keys(filterData)` (see e.g.
 * `user.service.ts` `getAllUsers`) — the set of keys is allow-listed per
 * module via each module's `*.constant.ts` `filterableFields` array at the
 * controller layer, not a fixed shape a static interface could usefully
 * describe here.
 *
 * In practice every value that survives to this type is always a plain query
 * string (`string | undefined`) — the `string[]`/nested-object branches exist
 * only because `qs` theoretically supports bracket-notation array/object
 * query params, which nothing in this codebase's filterable-fields lists
 * produces. Each service function narrows to `Record<string, string |
 * undefined>` once, at the point it destructures `params`, rather than
 * threading that assumption through the exported function signature.
 */
export interface IGenericFilters extends ParsedQs {}
