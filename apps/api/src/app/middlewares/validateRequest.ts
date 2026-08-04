import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodRawShape } from "zod";

type AnyZodObject = ZodObject<ZodRawShape>;

/**
 * Validates (and replaces) req.body against a Zod schema.
 *
 * Supports multipart/form-data uploads where the JSON payload arrives as a
 * stringified `data` field alongside file fields (multer leaves everything
 * else in req.body as strings) — that's unwrapped and parsed before
 * validation.
 */
const validateRequest =
  (zodSchema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }
      req.body = await zodSchema.parseAsync(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;

