import { Editor } from "@tiptap/core";
import { defaultExtensions } from "@/ui/editor/extensions";
import { getCollaborationExtensions } from "@/ui/editor/extensions/collaboration";

export function createHeadlessEditor(
  documentId: string,
  agentName: string,
  agentColor: string
) {
  return new Editor({
    extensions: [
      ...defaultExtensions,
      ...getCollaborationExtensions(documentId, agentName, agentColor),
    ],
    autofocus: "end",
  });
}
