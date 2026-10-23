import type { ModelMessage } from "ai";
import { appContext } from "../../domain/index.ts";
import { tblChatMessage, type IChatMessageModel } from "../../infrastructure/db/sqlite/tbl_chat_message.ts";
import { getModelById } from "../../infrastructure/index.ts";

export class ContextManager {
    /** How many older messages the last getContext() call dropped to fit the budget. */
    lastTrimmedCount = 0;

    calculateCostUsd(modelName: string, promptTokens: number, completionTokens: number): number {
        const modelConfig = getModelById(modelName);
        const inputPrice = modelConfig?.inputPer1M ?? 0.20;
        const outputPrice = modelConfig?.outputPer1M ?? 0.50;

        const inputCost = (promptTokens / 1_000_000) * inputPrice;
        const outputCost = (completionTokens / 1_000_000) * outputPrice;

        return +((inputCost + outputCost).toFixed(6));
    }

    getHistoryTokenBudget(modelId: string): number {
        const config = getModelById(modelId);
        const contextWindow = config?.contextWindow ?? 64000;
        return Math.min(32000, Math.max(4000, Math.floor((contextWindow - 20000) * 0.5)));
    }

    private estimateTokens(text: string): number {
        return Math.ceil((text ?? "").length / 4);
    }

    private pruneHistoricalContent(content: string): string {
        if (content.length > 500 && content.includes("### Database:")) {
            return content.replace(/### Database:[\s\S]*?(?=\n###|\n\n[A-Z]|$)/g, (match) => {
                const dbHeader = match.split("\n")[0];
                return `${dbHeader}\n*[Schema Introspection Details Pruned from History]*`;
            });
        }
        return content;
    }

    private normalizeRoles(messages: ModelMessage[]): ModelMessage[] {
        const result: ModelMessage[] = [];
        for (const msg of messages) {
            const last = result[result.length - 1];
            if (last && last.role === msg.role && typeof last.content === "string" && typeof msg.content === "string") {
                last.content = `${last.content}\n\n${msg.content}`;
            } else {
                result.push({ ...msg });
            }
        }
        while (result.length > 0 && result[0]!.role !== "user") {
            result.shift();
        }
        return result;
    }

    async getContext(userPrompt: string, excludeMessageId?: string): Promise<ModelMessage[]> {
        this.lastTrimmedCount = 0;
        const sessionId = appContext.currentChatSessionId;
        if (!sessionId) {
            return [{ role: 'user', content: userPrompt }];
        }
        
        const modelId = appContext.selectedModel.modelId;
        const maxHistoryTokenBudget = this.getHistoryTokenBudget(modelId!);
        
        try {
            const dbMessages = tblChatMessage.getChatMessages(sessionId);
            if (!dbMessages || dbMessages.length === 0) {
                return [{ role: 'user', content: userPrompt }];
            }

            const validMessages = dbMessages.filter(
                (msg: IChatMessageModel) => (msg.role === "user" || msg.role === "assistant") && msg.id !== excludeMessageId
            );
            const selectedMessages: ModelMessage[] = [];
            let accumulatedTokens = this.estimateTokens(userPrompt);
            
            for (let i = validMessages.length - 1; i >= 0; i--) {
                const msg = validMessages[i]!;
                const isLatestMessage = i === validMessages.length - 1;
                const content = (msg.role === "assistant" && !isLatestMessage)
                    ? this.pruneHistoricalContent(msg.content)
                    : msg.content;
                const messageTokens = this.estimateTokens(content);
                if (accumulatedTokens + messageTokens > maxHistoryTokenBudget && selectedMessages.length > 0) {
                    this.lastTrimmedCount = i + 1;
                    break;
                }
                accumulatedTokens += messageTokens;
                selectedMessages.unshift({
                    role: msg.role as "user" | "assistant",
                    content: content,
                });
            }
            
            selectedMessages.push({ role: 'user', content: userPrompt });
            return this.normalizeRoles(selectedMessages);
        } catch (error) {
            appContext.commandCtx?.log(`[ContextManager] Error constructing token-budgeted context: ${error}`);
            return [{ role: 'user', content: userPrompt }];
        }
    }
}