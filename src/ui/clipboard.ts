import {
  createClipboard,
  createHostClipboard,
  createRendererClipboardAdapter,
  type CliRenderer,
  type ClipboardService,
} from "@opentui/core";

let service: ClipboardService | undefined;

export async function copyToClipboard(renderer: CliRenderer, text: string): Promise<boolean> {
  if (!text) return false;
  try {
    service ??= createClipboard({
      host: createHostClipboard(),
      terminal: createRendererClipboardAdapter(renderer),
    });
    const result = await service.writeText(text, { destination: "all-available" });
    return result.host.status === "written" || result.terminal.status === "attempted";
  } catch {
    return false;
  }
}
