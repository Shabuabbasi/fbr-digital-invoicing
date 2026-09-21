import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}`, code: "NOT_FOUND" });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { code: err.code, path: req.path });
    }
    res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
    return;
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  logger.error(message, { path: req.path, stack: err instanceof Error ? err.stack : undefined });

  res.status(500).json({
    success: false,
    message: isProduction ? "Internal server error" : message,
    code: "INTERNAL_ERROR",
  });
}
