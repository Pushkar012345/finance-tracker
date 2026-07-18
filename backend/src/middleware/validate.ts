import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export interface ValidatedRequest extends Request {
  validatedQuery?: any;
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed.",
        details: result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };
}

// Express 5 made req.query a read-only getter, so we can no longer
// reassign it directly. Instead, store the validated/coerced result
// on a separate property and read from there in controllers.
export function validateQuery(schema: ZodSchema) {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid query parameters.",
        details: result.error.flatten().fieldErrors,
      });
    }

    req.validatedQuery = result.data;
    next();
  };
}