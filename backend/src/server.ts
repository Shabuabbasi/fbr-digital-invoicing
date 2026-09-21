import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function main() {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Intelgency Digital Invoicing API listening on port ${env.port}`, { env: env.nodeEnv });
  });
}

main().catch((err) => {
  logger.error("Failed to start server", { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
