import { Request } from "express";
import { AppError } from "../middleware/errorHandler";

// req.params.id is typed as string | string[] by Express. In practice,
// for a route like "/:id" it's always a single string — this helper
// makes that guarantee explicit and throws a clean error otherwise.
export function getIdParam(req: Request, paramName = "id"): string {
  const value = req.params[paramName];
  if (typeof value !== "string") {
    throw new AppError(`Invalid ${paramName} parameter.`, 400);
  }
  return value;
}