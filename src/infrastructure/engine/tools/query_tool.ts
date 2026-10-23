import { tool } from "ai";
import z from "zod";
import { pool } from "../../db/index.ts";
import { validateGeneratedSql } from "../core/db_overview.ts";

const MAX_ROWS = 100;
const MAX_RESULT_CHARS = 20_000;

/** Keep tool output small: it is re-sent to the model on every later step. */
function capRows(rows: Record<string, unknown>[]) {
    let kept = rows.slice(0, MAX_ROWS);
    while (kept.length > 1 && JSON.stringify(kept).length > MAX_RESULT_CHARS) {
        kept = kept.slice(0, Math.ceil(kept.length / 2));
    }
    return kept;
}

export const executeQueryTool = tool({
    description: `Execute a read-only SQL query against the connected database and return results to the user. 
    IMPORTANT: Only call this tool AFTER explicitly asking the user for permission.
    Only use for SELECT queries. Never for INSERT, UPDATE, DELETE, DROP.`,
    inputSchema: z.object({
        sql: z.string().describe("The validated SELECT query to execute"),
        dbId: z.string().describe("Database ID to run the query against"),
        userConfirmed: z.boolean().describe("Whether user has confirmed they want to run this query"),
    }),
    execute: async ({ sql, dbId, userConfirmed }) => {
        if (!userConfirmed) {
            return { 
                status: "pending_confirmation",
                message: "Waiting for user confirmation before executing."
            };
        }

        const validation = validateGeneratedSql(sql, false);
        if (!validation.valid || !validation.cleanSql) {
            return { 
                status: "rejected",
                error: `Query rejected: ${validation.error}` 
            };
        }

        try {
            const result = await pool.query(dbId, validation.cleanSql);
            const rows = capRows(result.rows);
            return {
                status: "success",
                rowCount: result.rowCount,
                ...(rows.length < result.rows.length
                    ? { truncated: true, note: `Only the first ${rows.length} of ${result.rows.length} rows are shown. Tell the user, and suggest a LIMIT or narrower query.` }
                    : {}),
                columns: result.fields.map(f => f.name),
                rows,
                executedSql: validation.cleanSql,
            };
        } catch (err) {
            return { 
                status: "error",
                error: (err as Error).message 
            };
        }
    }
});