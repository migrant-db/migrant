import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { tblChatMessage } from "./tbl_chat_message.ts";
import { tblChatSessions } from "./tbl_chat_sessions.ts";
import { tblDatabases } from "./tbl_databases.ts";
import { tblDocuments } from "./tbl_documents.ts";
import { tblProvider } from "./tbl_provider.ts";
import { tblSessionState } from "./tbl_session_state.ts";
import { tblUserSession } from "./tbl_user_session.ts";

const dataDir = join(homedir(), ".migrant");
mkdirSync(dataDir, { recursive: true, mode: 0o700 });

export const sqlClient: Database = new Database(join(dataDir, "migrant.db"));

export function initializeDatabase() {
    tblChatMessage.initializeTblChatMessage();
    tblChatSessions.initializeTblChatSessions();
    tblProvider.initializeTblProvider();
    tblDatabases.initializeTblDatabases();
    tblUserSession.initializeTblUserSessions();
    tblDocuments.initializeTblDocuments();
    tblSessionState.initializeTblSessionState();
}

export function resetDb() {
    sqlClient.run(`DELETE FROM tbl_databases`);
    sqlClient.run(`DELETE FROM tbl_chat_sessions`);
    sqlClient.run(`DELETE FROM tbl_chat_messages`);
    sqlClient.run(`DELETE FROM tbl_documents`);
    sqlClient.run(`DELETE FROM tbl_provider`);
    sqlClient.run(`DELETE FROM tbl_user_sessions`)
    sqlClient.run(`DELETE FROM tbl_session_state`);
}