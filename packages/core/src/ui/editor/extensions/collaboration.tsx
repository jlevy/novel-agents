import { Collaboration } from "@tiptap/extension-collaboration";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { CollaborationCursor } from "@tiptap/extension-collaboration-cursor";

const providers: { [key: string]: WebrtcProvider } = {};
const getProvider = (documentId: string) => {
  if (!providers[documentId]) {
    const doc = new Y.Doc();

    // const idbProvider = new IndexeddbPersistence(
    //   documentId,
    //   providers[documentId].doc
    // );
    // idbProvider.on("synced", () => {
    //   console.log("Content from the local database was loaded");
    // });
    providers[documentId] = new WebrtcProvider(documentId, doc);
  }
  return providers[documentId];
};

export function getCollaborationExtensions(
  documentId: string,
  username: string,
  color: string
) {
  const provider = getProvider(documentId);
  return [
    Collaboration.configure({
      document: provider.doc,
    }),
    CollaborationCursor.configure({
      provider: provider,
      user: {
        name: username,
        color: color,
      },
    }),
  ];
}
