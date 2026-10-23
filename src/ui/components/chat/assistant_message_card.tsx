/** @jsxImportSource @opentui/react */
import { useStdoutDimensions } from "../../hooks/useStdoutDimensions.ts";
import { theme } from "../../theme.ts";
import { MarkdownRenderer } from "./markdown_renderer.tsx";

/** Reasoning is capped at this many rows; anything longer scrolls. */
const REASONING_MAX_ROWS = 6;

export interface AssistantMessageCardProps {
  response: string;
  isStreaming?: boolean;
  thoughtTime?: string;
  reasoningStream?: string;
}

export function AssistantMessageCard({
  response,
  isStreaming,
  thoughtTime,
  reasoningStream,
}: AssistantMessageCardProps) {
  const { width } = useStdoutDimensions();
  const accentColor = theme.thinkingAccents[0] ?? theme.accent;
  const hasReasoning = reasoningStream && reasoningStream.length > 0;
  // Rough wrapped-line count so short reasoning doesn't leave empty rows.
  const wrapWidth = Math.max(20, width - 12);
  const reasoningRows = hasReasoning
    ? reasoningStream.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.length / wrapWidth)), 0)
    : 0;
  const isThinking = isStreaming && hasReasoning && !response;

  return (
    <box style={{ flexDirection: "column", paddingLeft: 1, paddingRight: 1, marginBottom: 1 }}>
      
      {/* Header */}
      <box style={{ justifyContent: "space-between" }}>
        <text style={{ fg: theme.brandLight }}>
          <strong>◆ Migrant Intelligence</strong>
        </text>
        {isStreaming && !thoughtTime ? (
          <text style={{ fg: accentColor }}>
            <strong>+ Thinking...</strong>
          </text>
        ) : thoughtTime ? (
          <text style={{ fg: accentColor }}>
            <strong>+ Thought: {thoughtTime}</strong>
          </text>
        ) : null}
      </box>

      {hasReasoning && (
        <box
          style={{
            flexDirection: "column",
            marginBottom: 1,
            paddingLeft: 1,
            border: ["left"],
            borderColor: theme.textSubtle,
          }}
        >
          <text style={{ fg: theme.textSubtle }}>
            <strong>Reasoning</strong>
          </text>
          <scrollbox
            style={{
              height: Math.min(REASONING_MAX_ROWS, reasoningRows),
              flexShrink: 0,
              stickyScroll: true,
              stickyStart: "bottom",
              rootOptions: { backgroundColor: theme.bgCanvas },
              wrapperOptions: { backgroundColor: theme.bgCanvas },
              viewportOptions: { backgroundColor: theme.bgCanvas },
              contentOptions: { backgroundColor: theme.bgCanvas },
            }}
          >
            <text style={{ fg: theme.textSubtle }} content={reasoningStream} />
          </scrollbox>
        </box>
      )}

      {response ? (
        <MarkdownRenderer content={response} />
      ) : isThinking ? (
        <text style={{ fg: theme.textSubtle }}>Working...</text>
      ) : null}

    </box>
  );
}