import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import * as productController from "./product.controller";

export const productRouter = Router();

productRouter.use(requireAuth);

// Both roles can view (spec §7/§3); only ADMIN can mutate — see docs/RBAC.md.
productRouter.get("/", productController.list);
productRouter.get("/:id", productController.getById);
productRouter.post("/", requireRole("ADMIN"), productController.create);
productRouter.patch("/:id", requireRole("ADMIN"), productController.update);
productRouter.delete("/:id", requireRole("ADMIN"), productController.deactivate);
