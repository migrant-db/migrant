import { sqlClient } from "./sqlite.client.ts";

export interface IChatSessionsModel {
    id: string;
    user_id: string;
    title: string;
    session_token_used: number;
    session_token_limit: number;
    /** Tokens currently occupying the context window (last step's input + output). */
    context_tokens: number;
    created_at: string;
    updated_at: string;
}

class TblChatSessions {
    private chatSessionInsertStmt: any;
    private chatSessionSelectStmt: any;
    private chatSessionSelectByIdStmt: any;
    private chatSessionDeleteStmt: any;

    initializeTblChatSessions() {
        sqlClient.run(`
          CREATE TABLE IF NOT EXISTS tbl_chat_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT 'New Conversation',
            session_token_limit BIGINT NOT NULL DEFAULT 100000,
            session_token_used BIGINT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        // Migration for databases created before context_tokens existed.
        try {
            sqlClient.run('ALTER TABLE tbl_chat_sessions ADD COLUMN context_tokens BIGINT NOT NULL DEFAULT 0');
        } catch { /* column already exists */ }

        this.chatSessionInsertStmt = sqlClient.prepare(
            'INSERT OR REPLACE INTO tbl_chat_sessions (id, user_id, title,session_token_limit, session_token_used, context_tokens, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)'
        );
        this.chatSessionSelectStmt = sqlClient.prepare(
            'SELECT * FROM tbl_chat_sessions WHERE user_id = ? order by updated_at desc'
        );
        this.chatSessionSelectByIdStmt = sqlClient.prepare(
            'SELECT * FROM tbl_chat_sessions WHERE id = ?'
        );
        this.chatSessionDeleteStmt = sqlClient.prepare(
            'DELETE FROM tbl_chat_sessions WHERE id = ?'
        );
    }

    setChatSession(chatSession: IChatSessionsModel): IChatSessionsModel | undefined { 
        this.chatSessionInsertStmt.run(
            chatSession.id, 
            chatSession.user_id, 
            chatSession.title, 
            chatSession.session_token_limit, 
            chatSession.session_token_used, 
            chatSession.context_tokens ?? 0,
            chatSession.created_at,
            chatSession.updated_at
        );
        return this.getChatSessionById(chatSession.id);
    }

    getChatSessions(userId: string) { 
        return this.chatSessionSelectStmt.all(userId) as IChatSessionsModel[];
    }

    getChatSessionById(sessionId: string) { 
        return this.chatSessionSelectByIdStmt.get(sessionId) as IChatSessionsModel |undefined;
    }

    deleteChatSession(userId: string): boolean {
        const info = this.chatSessionDeleteStmt.run(userId);
        return info.changes > 0;
    }
}

export const tblChatSessions = new TblChatSessions();