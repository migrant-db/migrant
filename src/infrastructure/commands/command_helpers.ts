import { appContext, type CommandContext, type CommandDefinition } from "../../domain/index.ts";
import { pool } from "../../infrastructure/index.ts";

export function parseCommandInput(input: string): {
  name: string;
  args: string;
} | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const spaceIndex = trimmed.indexOf(" ");

  if (spaceIndex === -1) {
    const name = trimmed.slice(1);
    return name ? { name, args: "" } : null;
  }

  const name = trimmed.slice(1, spaceIndex);
  if (!name) {
    return null;
  }

  return { name, args: trimmed.slice(spaceIndex + 1).trim() };
}

export async function requireAuth(): Promise<void> {
  const user = await appContext.services.authService.checkLoginGuard();
  if (!user) {
    throw new Error("You must be logged in. Run /login first.");
  }
}

export function requireModel(): void {
  if (!appContext.providerSdk || !appContext.selectedModel.modelId) {
    throw new Error("No AI model selected. Run /models to choose a provider and add your API key.");
  }
}

export async function runCommand(
  command: CommandDefinition,
  args: string,
  ctx: CommandContext,
): Promise<void> {
  if (command.requiresAuth) {
    await requireAuth();
  }

  if (command.requiresConnection && Object.keys(pool.pools).length === 0) {
    throw new Error("No database connected. Run /connect first.");
  }

  const originalLog = console.log;
  const originalError = console.error;

  const sink = (...values: unknown[]): void => {
    const line = values.map(formatConsoleValue).join(" ");
    for (const part of line.split("\n")) {
      ctx.log(part.length > 0 ? part : " ");
    }
  };

  console.log = sink;
  console.error = sink;

  try {
    await command.execute(args, ctx);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

function formatConsoleValue(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function parseAndValidatePgUrl(connectionString: string): {
  isValid: boolean;
  sslmode?: string | null;
  database?: string;
  host?: string;
  port?: number;
  normalizedUrl?: string;
  error?: string;
} {
  try {
    const trimmed = connectionString.trim();

    if (!trimmed) {
      return { isValid: false, error: "Connection string is empty." };
    }

    if (
      !trimmed.startsWith("postgres://") &&
      !trimmed.startsWith("postgresql://")
    ) {
      return {
        isValid: false,
        error: "Must start with postgres:// or postgresql://",
      };
    }

    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return { isValid: false, error: "Malformed connection string." };
    }

    const socketHost = url.searchParams.get("host");
    const host = url.hostname || socketHost;
    if (!host) {
      return { isValid: false, error: "Host is missing." };
    }

    const port = url.port ? parseInt(url.port, 10) : 5432;
    if (isNaN(port) || port < 1 || port > 65535) {
      return { isValid: false, error: "Invalid port number." };
    }

    const rawDb = url.pathname.replace(/^\//, "");
    const database = rawDb ? decodeURIComponent(rawDb) : undefined;
    if (!database) {
      return { isValid: false, error: "Database name is missing." };
    }

    const sslmode = url.searchParams.get("sslmode");

    return {
      isValid: true,
      sslmode,
      database,
      host,
      port,
      normalizedUrl: url.toString(),
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: error?.message || "Invalid connection string.",
    };
  }
}