import { requireRole } from "./rbac";
import { ApiError } from "../utils/ApiError";
import type { Request, Response, NextFunction } from "express";

function mockReq(role?: "ADMIN" | "ACCOUNTANT"): Request {
  return { user: role ? { sub: "u1", companyId: "c1", role } : undefined } as unknown as Request;
}

describe("requireRole", () => {
  it("calls next() when the user has an allowed role", () => {
    const next = jest.fn() as unknown as NextFunction;
    requireRole("ADMIN")(mockReq("ADMIN"), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("throws FORBIDDEN when the user's role is not allowed", () => {
    const next = jest.fn() as unknown as NextFunction;
    expect(() => requireRole("ADMIN")(mockReq("ACCOUNTANT"), {} as Response, next)).toThrow(ApiError);
    try {
      requireRole("ADMIN")(mockReq("ACCOUNTANT"), {} as Response, next);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(403);
      expect((err as ApiError).code).toBe("FORBIDDEN");
    }
  });

  it("throws UNAUTHORIZED when there is no authenticated user", () => {
    const next = jest.fn() as unknown as NextFunction;
    expect(() => requireRole("ADMIN")(mockReq(), {} as Response, next)).toThrow(ApiError);
  });

  it("allows any role listed", () => {
    const next = jest.fn() as unknown as NextFunction;
    requireRole("ADMIN", "ACCOUNTANT")(mockReq("ACCOUNTANT"), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
