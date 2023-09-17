"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorContent,
  Extension,
  JSONContent,
  useEditor,
} from "@tiptap/react";
import { defaultEditorProps } from "./props";
import { defaultExtensions } from "./extensions";
import useLocalStorage from "@/lib/hooks/use-local-storage";
import { useDebouncedCallback } from "use-debounce";
import { useCompletion } from "ai/react";
import { toast } from "sonner";
import va from "@vercel/analytics";
import { defaultEditorContent } from "./default-content";
import { EditorBubbleMenu } from "./bubble-menu";
import { getPrevText } from "@/lib/editor";
import { ImageResizer } from "./extensions/image-resizer";
import { EditorProps } from "@tiptap/pm/view";
import { Editor as EditorClass } from "@tiptap/core";
import { getCollaborationExtensions } from "@/ui/editor/extensions/collaboration";
import { DEFAULT_DOCUMENT_ID } from "@/ui/editor/constants";
import { createHeadlessEditor } from "@/ui/editor/headlessEditor";

// Instantiate a headless editor and try and add some data to it
// setTimeout(() => {
//   const agentName = "Caecilius";
//   const e = createHeadlessEditor(DEFAULT_DOCUMENT_ID, agentName, "#F98181");
//
//   e.chain().focus().setTextSelection(e.state.doc.nodeSize);
//   console.log("Editor", e.isCapturingTransaction, e.isEditable, e.isFocused);
//
//   const li =
//     "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc pretium ligula eget magna facilisis condimentum
// vel quis mi. Donec ac nunc sollicitudin elit tincidunt sollicitudin eget ut quam. Curabitur sed ipsum quam. Aenean
// faucibus id magna at cursus. Morbi sit amet felis vehicula, faucibus turpis in, cursus nisl. Nulla facilisi. Quisque
// eget ipsum sed ex mollis mollis. Nullam viverra orci ut diam ornare, quis imperdiet metus rutrum. Interdum et
// malesuada fames ac ante ipsum primis in faucibus. In lobortis tincidunt velit sit amet posuere. In in sapien
// lacinia, vulputate lorem at, pretium nibh. Nulla facilisi. Praesent pulvinar dui scelerisque elit placerat
// tempor.\n" + "\n" + "Curabitur elementum vel leo in semper. Praesent id ex odio. Ut posuere erat ut aliquet gravida.
// Vivamus quis urna eget urna egestas vulputate et quis enim. Curabitur porttitor vitae tortor at convallis. Nunc leo
// lacus, lacinia ut interdum ac, eleifend a tortor. Donec turpis magna, mollis at luctus ac, eleifend vel sem. Integer
// gravida semper est, at malesuada elit tempor sit amet. Etiam justo nisl, pretium ac finibus nec, scelerisque a
// massa. Vivamus ut lobortis augue. Fusce condimentum orci blandit mauris rhoncus viverra."; setTimeout(async () => { console.log("USERS", e.storage.collaborationCursor.users);  for (const char of [...li]) { e.commands.focus(); const tr = e.state.tr; tr.insertText(char); e.view.dispatch(tr); // console.log(e.state.selection.to); await new Promise((resolve) => setTimeout(resolve, 50)); } }, 1000); }, 2000);

const collaborationExtensions = getCollaborationExtensions(
  DEFAULT_DOCUMENT_ID,
  "Human",
  "#abcdef"
);

export default function Editor({
  completionApi = "/api/generate",
  className = "relative min-h-[500px] w-full max-w-screen-lg border-stone-200 bg-white sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg",
  defaultValue = defaultEditorContent,
  extensions = [],
  editorProps = {},
  onUpdate = () => {},
  onDebouncedUpdate = () => {},
  debounceDuration = 750,
  storageKey = "novel__content",
}: {
  /**
   * The API route to use for the OpenAI completion API.
   * Defaults to "/api/generate".
   */
  completionApi?: string;
  /**
   * Additional classes to add to the editor container.
   * Defaults to "relative min-h-[500px] w-full max-w-screen-lg border-stone-200 bg-white sm:mb-[calc(20vh)]
   * sm:rounded-lg sm:border sm:shadow-lg".
   */
  className?: string;
  /**
   * The default value to use for the editor.
   * Defaults to defaultEditorContent.
   */
  defaultValue?: JSONContent | string;
  /**
   * A list of extensions to use for the editor, in addition to the default Novel extensions.
   * Defaults to [].
   */
  extensions?: Extension[];
  /**
   * Props to pass to the underlying Tiptap editor, in addition to the default Novel editor props.
   * Defaults to {}.
   */
  editorProps?: EditorProps;
  /**
   * A callback function that is called whenever the editor is updated.
   * Defaults to () => {}.
   */
  // eslint-disable-next-line no-unused-vars
  onUpdate?: (editor?: EditorClass) => void | Promise<void>;
  /**
   * A callback function that is called whenever the editor is updated, but only after the defined debounce duration.
   * Defaults to () => {}.
   */
  // eslint-disable-next-line no-unused-vars
  onDebouncedUpdate?: (editor?: EditorClass) => void | Promise<void>;
  /**
   * The duration (in milliseconds) to debounce the onDebouncedUpdate callback.
   * Defaults to 750.
   */
  debounceDuration?: number;
  /**
   * The key to use for storing the editor's value in local storage.
   * Defaults to "novel__content".
   */
  storageKey?: string;
}) {
  const [content, setContent] = useLocalStorage(storageKey, defaultValue);

  const [hydrated, setHydrated] = useState(false);

  const debouncedUpdates = useDebouncedCallback(async ({ editor }) => {
    const json = editor.getJSON();
    setContent(json);
    onDebouncedUpdate(editor);
  }, debounceDuration);

  const editor = useEditor({
    extensions: [
      ...defaultExtensions,
      ...extensions,
      ...collaborationExtensions,
    ],
    editorProps: {
      ...defaultEditorProps,
      ...editorProps,
    },
    onUpdate: (e) => {
      const selection = e.editor.state.selection;
      const lastTwo = getPrevText(e.editor, {
        chars: 2,
      });
      if (lastTwo === "++" && !isLoading) {
        e.editor.commands.deleteRange({
          from: selection.from - 2,
          to: selection.from,
        });
        complete(
          getPrevText(e.editor, {
            chars: 5000,
          })
        );
        // complete(e.editor.storage.markdown.getMarkdown());
        va.track("Autocomplete Shortcut Used");
      } else {
        onUpdate(e.editor);
        debouncedUpdates(e);
      }
    },
    autofocus: "end",
  });

  const { complete, completion, isLoading, stop } = useCompletion({
    id: "novel",
    api: completionApi,
    onFinish: (_prompt, completion) => {
      editor?.commands.setTextSelection({
        from: editor.state.selection.from - completion.length,
        to: editor.state.selection.from,
      });
    },
    onError: (err) => {
      toast.error(err.message);
      if (err.message === "You have reached your request limit for the day.") {
        va.track("Rate Limit Reached");
      }
    },
  });

  const prev = useRef("");

  // Insert chunks of the generated text
  useEffect(() => {
    const diff = completion.slice(prev.current.length);
    prev.current = completion;
    editor?.commands.insertContent(diff);
  }, [isLoading, editor, completion]);

  useEffect(() => {
    // if user presses escape or cmd + z and it's loading,
    // stop the request, delete the completion, and insert back the "++"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.metaKey && e.key === "z")) {
        stop();
        if (e.key === "Escape") {
          editor?.commands.deleteRange({
            from: editor.state.selection.from - completion.length,
            to: editor.state.selection.from,
          });
        }
        editor?.commands.insertContent("++");
      }
    };
    const mousedownHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stop();
      if (window.confirm("AI writing paused. Continue?")) {
        complete(editor?.getText() || "");
      }
    };
    if (isLoading) {
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("mousedown", mousedownHandler);
    } else {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    };
  }, [stop, isLoading, editor, complete, completion.length]);

  // Hydrate the editor with the content from localStorage.
  useEffect(() => {
    if (editor && content && !hydrated) {
      // We disable setting the content her to avoid it looking like an update to the ydoc
      // editor.commands.setContent(content);
      setHydrated(true);
    }
  }, [editor, content, hydrated]);

  return (
    <div
      onClick={() => {
        editor?.chain().focus().run();
      }}
      className={className}
    >
      {editor && <EditorBubbleMenu editor={editor} />}
      {editor?.isActive("image") && <ImageResizer editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
