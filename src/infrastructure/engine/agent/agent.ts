import type { User } from "@supabase/supabase-js";
import { streamText } from "ai";
import type { CommandContext, DatabaseCollection } from "../../../domain/index.ts";
import { appContext } from "../../../domain/index.ts";
import { tblSessionState, type ISessionState } from "../../db/sqlite/tbl_session_state.ts";
import { AGENT_SYSTEM_PROMPT } from "../prompts/agent_prompt.ts";
import { tools } from "../tools/tools.ts";

const MAX_STEPS = 10;

export async function runAgent(query: string, ctx: CommandContext): Promise<void> {
    const user = await appContext.services.authService.getCurrentUser();
    const databases = appContext.workspace.databases.map(db => ({
        id: db.id,
        name: db.name,
        type: db.type,
        schemaFingerPrint: db.schemaFingerprint,
        indexStatus: db.indexStatus,
    }));

    const userMessage = await appContext.services.memoryService.ensureActiveSession(query);
    if (userMessage && ctx.output) {
        ctx.output({ type: "user", content: userMessage });
    }

    const sessionId = appContext.currentChatSessionId;
    const sessionState = sessionId ? tblSessionState.getState(sessionId) : undefined;
    const systemPrompt = buildSystemPromptWithContext(AGENT_SYSTEM_PROMPT, user, databases, sessionState);

    if (ctx.startAssistantStream) {
        ctx.startAssistantStream();
    }

    const messages = await appContext.services.contextManager.getContext(query, userMessage?.id);
    if (appContext.services.contextManager.lastTrimmedCount > 0) {
        ctx.log(`Context limit reached: ${appContext.services.contextManager.lastTrimmedCount} older message(s) left out of this request.`);
    }
    const startTime = Date.now();
    let thoughtTimeStr = "";
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let contextTokens = 0;
    let malformedAttempts = 0;
    const MAX_MALFORMED = 3;

    let cumulativeText = "";
    let cumulativeReasoning = "";

    for (let step = 0; step < MAX_STEPS; step++) {
        const abortController = new AbortController();
        const stepStartLength = cumulativeText.length;
        const streamResult = streamText({
            model: appContext.providerSdk!(appContext.selectedModel.modelId!),
            system: systemPrompt,
            messages,
            tools,
            toolChoice: "auto",
            maxOutputTokens: 2000,
            abortSignal: abortController.signal,
            onError(_) { }
        });

        let isMalformed = false;

        try {
            for await (const chunk of streamResult.stream) {
                if (chunk.type === "text-delta") {
                    cumulativeText += chunk.text;
                    ctx.updateAssistantStream?.({ text: cumulativeText, reasoning: cumulativeReasoning });

                    const stepText = cumulativeText.slice(stepStartLength);
                    const leakedToolCall =
                        stepText.match(/<\|.*?\|>[\s\S]*?(?:<\|.*?\|>|$)/g) ||
                        stepText.match(/<tool_call>[\s\S]*?<\/tool_call>/gi) ||
                        stepText.match(/<function_calls>[\s\S]*?<\/function_calls>/gi) ||
                        stepText.match(/<invoke>[\s\S]*?<\/invoke>/gi) ||
                        stepText.match(/```json\s*\{\s*"tool"\s*:/gi);

                    if (leakedToolCall) {
                        malformedAttempts++;
                        if (malformedAttempts >= MAX_MALFORMED) {
                            ctx.error("Model is producing malformed responses. Try switching to a different model.");
                            return;
                        }
                        ctx.log("Repairing malformed tool call...");
                        abortController.abort();
                        messages.push({ role: "assistant", content: stepText });
                        messages.push({
                            role: "user",
                            content: "Your last response contained a malformed tool call. Use only the structured tool calling format, never raw XML or JSON tool calls in your text response."
                        });
                        cumulativeText = cumulativeText.slice(0, stepStartLength);
                        ctx.updateAssistantStream?.({ text: cumulativeText, reasoning: cumulativeReasoning });
                        isMalformed = true;
                        break;
                    }
                } else if (chunk.type === "reasoning-delta") {
                    cumulativeReasoning += chunk.text;
                    ctx.updateAssistantStream?.({ text: cumulativeText, reasoning: cumulativeReasoning });
                }
            }
        } catch (error) {
            if (isMalformed) continue;
            ctx.error(`Stream failed: ${(error as Error).message}`);
            return;
        }

        if (isMalformed) {
            continue;
        }

        const toolCalls = await streamResult.toolCalls;
        const usage = await streamResult.usage;
        const responseMessages = await streamResult.responseMessages;

        totalInputTokens += usage?.inputTokens ?? 0;
        totalOutputTokens += usage?.outputTokens ?? 0;
        contextTokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);

        if (toolCalls && toolCalls.length > 0) {
            messages.push(...responseMessages);
            continue;
        }

        if (!thoughtTimeStr) {
            const thoughtMs = Date.now() - startTime;
            thoughtTimeStr = thoughtMs < 1000 ? `${thoughtMs}ms` : `${(thoughtMs / 1000).toFixed(1)}s`;
        }

        if (ctx.updateAssistantStream) {
            ctx.updateAssistantStream({
                text: cumulativeText,
                reasoning: cumulativeReasoning
            });
        }

        const assistantMessage = await appContext.services.memoryService.saveTurnToMemory(
            {
                text: cumulativeText,
                modelId: appContext.selectedModel.modelId!,
                provider: appContext.selectedModel.providerId ?? "unknown",
            },
            totalInputTokens,
            totalOutputTokens,
            "agent",
            thoughtTimeStr,
            contextTokens,
        );

        if (assistantMessage && ctx.replaceLastWithItem) {
            ctx.replaceLastWithItem({
                type: "assistant",
                isStreaming: false,
                reasoningStream: cumulativeReasoning,
                content: {
                    ...assistantMessage,
                    thought_time: thoughtTimeStr,
                },
            });
        }

        return;
    }

    ctx.error("Agent reached maximum steps without completing. Try rephrasing your question.");
}

function buildSystemPromptWithContext(
    basePrompt: string,
    user: User | null,
    databases: Partial<DatabaseCollection>[],
    sessionState?: ISessionState
): string {
    const userEmail = user?.email || "Not logged in";
    const userName = user?.email ? user.email.split("@")[0] : "Developer";
    const dbList = databases.length > 0 ? JSON.stringify(databases.map((d) => {
        return {
            id: d.id,
            name: d.name,
        }
    })) : "None connected";
    const stateContext = sessionState ? `
### What I Already Know This Session:
${JSON.stringify(sessionState, null, 2)}` : "";

    return `${basePrompt.trim()}
### Active Environment Context:
- Talking to User: ${userName} (${userEmail})
- Connected Databases (${databases.length}): ${dbList}${stateContext}
`;
}

