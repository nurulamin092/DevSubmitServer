import { createApp } from "./app";
import { env } from "./config/env";
import { shutdownPrisma } from "./lib/prisma";
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(
    `🚀 DevSubmit API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
});

const shutdown = async (signal: string) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(async () => {
    await shutdownPrisma().catch((e) => console.error("[shutdown]", e));
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[shutdown] Force exit after timeout");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (r) =>
  console.error("[unhandledRejection]", r),
);
process.on("uncaughtException", (e) => {
  console.error("[uncaughtException]", e);
  process.exit(1);
});
