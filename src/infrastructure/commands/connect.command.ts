
import { appContext, type CommandContext, type CommandDefinition } from "../../domain/index.ts";
import { pool } from "../../infrastructure/index.ts";
import { emitEvent } from "../../utils/emitter.ts";
import { getDbName } from "../../utils/db_helpers.ts";
import { errorMessage, parseAndValidatePgUrl } from "./command_helpers.ts";

export const connectCommand: CommandDefinition = {
  name: "connect",
  description: "Connect and Scan the PostgreSQL database",
  busyLabel: "Connecting...",
  requiresAuth: true,
  execute: async (args, ctx) => {
    await connectDb(args, ctx);
  },
};

async function connectDb(args: string, ctx: CommandContext) {
  const connectionString = args.trim();

  const parsed = parseAndValidatePgUrl(connectionString);
  if (!parsed.isValid) {
    ctx.error(`Invalid URL: ${parsed.error}`);
    return;
  }

  const normalizedUrl = parsed.normalizedUrl!;
  const dbName = getDbName(normalizedUrl);

  const isDbExists = appContext.workspace.dbExists(normalizedUrl);
  if (isDbExists) {
    ctx.error('This database is already connected!');
    return;
  }

  if (parsed.sslmode) {
    ctx.log(`This connection is using ${parsed.sslmode} sslmode.`);
  }

  ctx.busy(`Connecting to ${dbName}...`);

  let db: string | null = null;
  try {
    db = await pool.setConnection(normalizedUrl);
    if (!db) {
      throw new Error("Could not register the connection.");
    }

    ctx.busy(`Verifying ${dbName} responds to queries...`);
    await pool.query(db, "SELECT 1");
  } catch (error) {
    if (db) {
      await pool.close(db);
      emitEvent.emit("update-databases");
    }
    throw new Error(`Connection failed: ${errorMessage(error)}${connectionHint(error)}`);
  }

  ctx.success(`Connected to ${dbName}`);
}

function connectionHint(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "ENOTFOUND" || code === "ENETUNREACH" || code === "ETIMEDOUT" || code === "EHOSTUNREACH") {
    return "\nHint: direct connection hosts can be IPv6-only. If your network lacks IPv6, use the pooler connection string instead.";
  }
  return "";
}
