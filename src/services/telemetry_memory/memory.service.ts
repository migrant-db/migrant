import { randomUUID } from "node:crypto";
import { appContext } from "../../domain/index.ts";
import type { IChatMessageModel, IChatSessionsModel } from "../../infrastructure/index.ts";
import { getModelById, tblChatMessage, tblChatSessions } from "../../infrastructure/index.ts";
import { emitEvent } from "../../utils/emitter.ts";

export interface TurnResult {
    text: string;
    modelId: string;
    provider: string;
}

export class MemoryService {
    async saveTurnToMemory(
        response: TurnResult,
        inputTokens: number,
        outputTokens: number,
        targetAgent?: string,
        thoughtTime?: string,
        contextTokens?: number
    ): Promise<IChatMessageModel | undefined> {
        try {
            const user = await appContext.services.authService.getCurrentUser();
            const sessionId = appContext.currentChatSessionId;
            if (!user || !sessionId) return undefined;

            const promptTokens = inputTokens ?? 0;
            const completionTokens = outputTokens ?? 0;
            const totalTokens = (promptTokens + completionTokens);

            const cost = appContext.services.contextManager.calculateCostUsd(
                response.modelId,
                promptTokens,
                completionTokens
            );

            const now = Date.now();

            const assistantMessage: IChatMessageModel = {
                id: randomUUID(),
                session_id: sessionId,
                user_id: user.id,
                role: 'assistant',
                content: response.text,
                provider: response.provider,
                model_name: response.modelId,
                target_agent: targetAgent ?? response.modelId,
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: totalTokens,
                cost_usd: cost,
                ...(thoughtTime !== undefined ? { thought_time: thoughtTime } : {}),
                created_at: new Date(now).toISOString(),
            };

            tblChatMessage.setChatMessage(assistantMessage);

            const currentSession = tblChatSessions.getChatSessionById(sessionId);
            if (currentSession) {
                const sessionTotalTokensUsed = (currentSession.session_token_used || 0) + totalTokens;
                const updatedSession = tblChatSessions.setChatSession({
                    ...currentSession,
                    session_token_used: sessionTotalTokensUsed,
                    context_tokens: contextTokens ?? currentSession.context_tokens ?? 0,
                    updated_at: new Date().toISOString(),
                });

                emitEvent.emit('update-session', {
                    updatedSession,
                });
            }
            return assistantMessage;
        } catch (error) {
            appContext.commandCtx?.log(`Error saving chat memory: ${error}`);
            return undefined;
        }
    }

    async ensureActiveSession(question: string): Promise<IChatMessageModel | undefined> {
        const user = await appContext.services.authService.getCurrentUser();
        if (!user) return undefined;

        let sessionId = appContext.currentChatSessionId;
        if (!sessionId) {
            const fallbackTitle = new Date().toLocaleString();
            const tokenLimit = getModelById(appContext.selectedModel.modelId ?? '')?.contextWindow ?? 0;

            const newSession: IChatSessionsModel = {
                id: randomUUID(),
                user_id: user.id,
                title: fallbackTitle,
                session_token_limit: tokenLimit,
                session_token_used: 0,
                context_tokens: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const session = tblChatSessions.setChatSession(newSession);
            if (session) {
                sessionId = session.id;
                appContext.currentChatSessionId = sessionId;

                emitEvent.emit('update-session', {
                    updatedSession: session,
                });
            }
        }

        if (sessionId) {
            const userMessage: IChatMessageModel = {
                id: randomUUID(),
                session_id: sessionId,
                user_id: user.id,
                role: 'user',
                content: question,
                provider: "user",
                model_name: "user",
                target_agent: "user",
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
                cost_usd: 0,
                created_at: new Date().toISOString(),
            };
            tblChatMessage.setChatMessage(userMessage);
            return userMessage;
        }

        return undefined;
    }
}
