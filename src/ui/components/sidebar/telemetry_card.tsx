/** @jsxImportSource @opentui/react */
import { getModelById } from "../../../infrastructure/index.ts";
import { theme } from "../../theme.ts";

export interface TelemetryCardProps {
  activeModel?: string | undefined;
  /** Tokens currently in the context window. */
  tokensUsed?: number | undefined;
  /** Cumulative tokens billed this session. */
  sessionTokens?: number | undefined;
  maxTokens?: number | undefined;
}

export function TelemetryCard({
  activeModel,
  tokensUsed,
  sessionTokens,
  maxTokens,
}: TelemetryCardProps) {
  let modelName = activeModel || "Default Model";
  if (activeModel) {
    const cleanId = activeModel.includes(":") ? activeModel.split(":")[1] : activeModel;
    const modelConfig = getModelById(cleanId || activeModel);
    if (modelConfig?.name) {
      modelName = modelConfig.name;
    }
  }

  const percentUsed =
    tokensUsed && maxTokens
      ? Math.min(100, Math.round((tokensUsed / maxTokens) * 100))
      : 0;

  return (
    <box
      style={{
        flexDirection: "column",
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 1,
        paddingBottom: 1,
        marginBottom: 1,
        border: true,
        borderColor: theme.borderPrimary,
      }}
    >
      <text style={{ fg: theme.accent }}>
        <strong>Context Window & Telemetry</strong>
      </text>

      <box style={{ flexDirection: "column", marginTop: 1 }}>
        <box style={{ justifyContent: "space-between" }}>
          <text style={{ fg: theme.textSecondary }}>Active Model:</text>
          <text style={{ fg: theme.brandLight }}>
            <strong>{modelName}</strong>
          </text>
        </box>

        {tokensUsed !== undefined && maxTokens !== undefined && maxTokens > 0 && (
          <>
            <box style={{ justifyContent: "space-between" }}>
              <text style={{ fg: theme.textSecondary }}>Context:</text>
              <text style={{ fg: theme.textPrimary }}>
                <strong>{tokensUsed.toLocaleString()} / {Math.round(maxTokens / 1000)}k</strong>
              </text>
            </box>

            {sessionTokens !== undefined && (
              <box style={{ justifyContent: "space-between" }}>
                <text style={{ fg: theme.textSecondary }}>Session Total:</text>
                <text style={{ fg: theme.textPrimary }}>
                  <strong>{sessionTokens.toLocaleString()}</strong>
                </text>
              </box>
            )}

            <box style={{ justifyContent: "space-between" }}>
              <text style={{ fg: theme.textSecondary }}>Window Capacity:</text>
              <text style={{ fg: percentUsed > 80 ? theme.warning : theme.brandLight }}>
                <strong>{percentUsed}%</strong>
              </text>
            </box>
          </>
        )}
      </box>
    </box>
  );
}
