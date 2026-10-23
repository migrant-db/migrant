/** @jsxImportSource @opentui/react */
import { useKeyboard } from "@opentui/react";
import type { IChatSessionsModel } from "../../../infrastructure/index.ts";
import { theme } from "../../theme.ts";
import { DatabaseCard } from "../sidebar/database_card.tsx";
import { TelemetryCard } from "../sidebar/telemetry_card.tsx";

export interface InfoPopupProps {
  databases?: string[] | undefined;
  session?: IChatSessionsModel | undefined;
  activeModel?: string | undefined;
  onClose: () => void;
}

export function InfoPopup({
  databases,
  session,
  activeModel,
  onClose,
}: InfoPopupProps) {
  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "return" || key.name === "enter") {
      onClose();
    }
  });

  return (
    <box style={{ flexDirection: "column" }}>
      <box style={{ marginBottom: 1, justifyContent: "center" }}>
        <text style={{ fg: theme.brandLight }}>
          <strong>Migrant System Status</strong>
        </text>
      </box>
      
      <box style={{ flexDirection: "row", gap: 2 }}>
        <box style={{ flexDirection: "column", width: 34 }}>
          <DatabaseCard databases={databases} sessionName={session?.title} />
          <TelemetryCard
            activeModel={activeModel}
            tokensUsed={session?.context_tokens || 0}
        sessionTokens={session?.session_token_used || 0}
            maxTokens={session?.session_token_limit || 0}
          />
        </box>
      </box>

      <box style={{ marginTop: 1, justifyContent: "center" }}>
        <text style={{ fg: theme.textDim }}>Press [Esc] or [Enter] to close</text>
      </box>
    </box>
  );
}
