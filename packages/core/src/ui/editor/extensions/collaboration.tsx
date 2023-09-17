import { Collaboration } from "@tiptap/extension-collaboration";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { CollaborationCursor } from "@tiptap/extension-collaboration-cursor";
import { IndexeddbPersistence } from "y-indexeddb";
// import YPartyKitProvider from "y-partykit/provider";

const providers: {
  [documentId: string]: {
    [username: string]: WebrtcProvider;
  };
} = {};
export const getProvider = (documentId: string, username: string) => {
  const partykitHost = "yjs.threepointone.partykit.dev/party";
  if (!providers[documentId]?.[username]) {
    const doc = new Y.Doc();
    const provider = new WebrtcProvider(documentId, doc);
    // const provider = new YPartyKitProvider(partykitHost, documentId, doc);

    if (!providers[documentId]) {
      providers[documentId] = { [username]: provider };
    } else {
      providers[documentId][username] = provider;
    }

    if (typeof window !== "undefined") {
      const idbProvider = new IndexeddbPersistence(
        documentId,
        providers[documentId][username].doc
      );
      idbProvider.on("synced", () => {
        console.log("Content from the local database was loaded");
      });
    }
  }
  return providers[documentId][username];
};

export function getCollaborationExtensions(
  documentId: string,
  username: string,
  color: string
) {
  const provider = getProvider(documentId, username);

  console.log(
    "CREATING COLLBORATION",
    documentId,
    username,
    "Client id",
    provider.doc.clientID
  );

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
