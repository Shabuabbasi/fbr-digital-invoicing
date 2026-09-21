import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { authRateLimiter } from "../../middleware/rateLimit";
import { login, logout, me, updateAvatar } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", authRateLimiter, login);
authRouter.get("/me", requireAuth, me);
authRouter.post("/logout", requireAuth, logout);
authRouter.patch("/avatar", requireAuth, updateAvatar);
