import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env, isProduction } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { companyRouter } from "./modules/company/company.routes";
import { productRouter } from "./modules/products/product.routes";
import { customerRouter } from "./modules/customers/customer.routes";
import { invoiceRouter } from "./modules/invoices/invoice.routes";
import { fbrRouter } from "./modules/fbr/fbr.routes";
import { reportRouter } from "./modules/reports/report.routes";
import { userRouter } from "./modules/users/user.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalRateLimiter } from "./middleware/rateLimit";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  // 4mb to accommodate profile picture data-URI uploads (PATCH /api/auth/avatar) — see
  // auth.validator.ts for the tighter per-field size cap on the image itself.
  app.use(express.json({ limit: "4mb" }));
  app.use(cookieParser());
  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use(globalRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok" } });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/company", companyRouter);
  app.use("/api/products", productRouter);
  app.use("/api/customers", customerRouter);
  app.use("/api/invoices", invoiceRouter);
  app.use("/api/fbr", fbrRouter);
  app.use("/api/reports", reportRouter);
  app.use("/api/users", userRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
