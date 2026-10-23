/** @jsxImportSource @opentui/react */
import type { AskOptions } from "../../../domain/index.ts";
import type { IChatSessionsModel } from "../../../infrastructure/index.ts";
import { theme } from "../../theme.ts";
import { Output, type OutputItem } from "../output.tsx";
import type { ParameterCommandType } from "../popups/index.ts";
import { CommandParameterPopup } from "../popups/index.ts";
import { Prompt } from "../prompt.tsx";
import { Sidebar } from "../sidebar/sidebar.tsx";
import { Spinner } from "../spinner.tsx";

export interface MainChatViewProps {
  mainWidth: number;
  sidebarWidth: number;
  outputs: OutputItem[];
  runKind: "idle" | "running" | "form";
  runLabel?: string | undefined;
  spinnerVisible: boolean;
  activePopup: ParameterCommandType | null;
  onParameterSubmit: (paramValue: string) => void;
  onClosePopup: () => void;
  onTriggerPopup: (type: ParameterCommandType) => void;
  databases?: string[] | undefined;
  sessions: IChatSessionsModel[];
  session?: IChatSessionsModel | undefined;
  activeModel?: string | undefined;
  input: string;
  onChangeInput: (value: string) => void;
  onSubmitInput: (value: string) => void;
  user?: string | undefined;
  formInputProps?: AskOptions;
  isCompact?: boolean;
}

export function MainChatView({
  mainWidth,
  sidebarWidth,
  outputs,
  runKind,
  runLabel,
  spinnerVisible,
  activePopup,
  onParameterSubmit,
  onClosePopup,
  onTriggerPopup,
  databases,
  sessions,
  session,
  activeModel,
  input,
  onChangeInput,
  onSubmitInput,
  user,
  formInputProps = {},
  isCompact = false,
}: MainChatViewProps) {
  return (
    <box
      style={{
        flexDirection: "row",
        flexGrow: 1,
        overflow: "hidden",
        backgroundColor: theme.bgCanvas,
      }}
    >
      <box
        style={{
          flexDirection: "column",
          width: mainWidth,
          overflow: "hidden",
          backgroundColor: theme.bgCanvas,
        }}
      >
        <box style={{ flexGrow: 1 }}>
          <scrollbox
            focused
            style={{
              flexGrow: 1,
              stickyScroll: true,
              stickyStart: "bottom",
              rootOptions: { backgroundColor: theme.bgCanvas },
              wrapperOptions: { backgroundColor: theme.bgCanvas },
              viewportOptions: { backgroundColor: theme.bgCanvas },
              contentOptions: { backgroundColor: theme.bgCanvas },
              scrollbarOptions: {
                showArrows: true,
                trackOptions: {
                  foregroundColor: theme.brandLight,
                  backgroundColor: theme.borderPrimary,
                },
              },
            }}
          >
            {outputs.map((item, index) => (
              <box key={index} style={{ width: mainWidth, flexShrink: 0 }}>
                <Output item={item} />
              </box>
            ))}

            {runKind === "running" && spinnerVisible && (
              <box style={{ width: mainWidth, marginTop: 1, flexShrink: 0 }}>
                <Spinner label={runLabel ?? "Working"} />
              </box>
            )}
          </scrollbox>
        </box>

        <box style={{ width: mainWidth, flexShrink: 0, flexDirection: "column" }}>          
          {runKind === "idle" ? (
            <Prompt
              value={input}
              onChange={onChangeInput}
              onSubmit={onSubmitInput}
              onTriggerPopup={onTriggerPopup}
              isActive={activePopup == null}
              {...(user !== undefined ? { user } : {})}
              {...(databases !== undefined ? { databases } : {})}
              />
          ) : runKind === "form" ? (
            <Prompt
              value={input}
              onChange={onChangeInput}
              onSubmit={onSubmitInput}
              onTriggerPopup={onTriggerPopup}
              isActive={activePopup == null}
              {...(runLabel !== undefined ? { label: runLabel } : {})}
              {...(formInputProps.placeholder !== undefined
                ? { placeholder: formInputProps.placeholder }
                : {})}
              {...(formInputProps.mask !== undefined
                ? { mask: formInputProps.mask }
                : {})}
            />
          ) : null}
          {isCompact && runKind === "idle" && activePopup == null && (
            <box style={{ flexDirection: "row", justifyContent: "space-between", paddingLeft: 1, paddingRight: 1, borderColor: theme.borderPrimary }}>
              <text style={{ fg: theme.badgeModel }}>
                {`[ Active DBs: ${databases?.length || 0} ] | [ Model: ${activeModel || "Unknown"} ] | [ Type /info ]`}
              </text>
            </box>
          )}
        </box>

        {activePopup != null && (
          <box style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
            <CommandParameterPopup
              command={activePopup}
              onSubmit={onParameterSubmit}
              onClose={onClosePopup}
              databases={databases}
              sessions={sessions}
              session={session}
              activeModel={activeModel}
            />
          </box>
        )}
      </box>

      {!isCompact && (
        <Sidebar
          databases={databases}
          session={session}
          activeModel={activeModel}
          width={sidebarWidth}
        />
      )}
    </box>
  );
}
