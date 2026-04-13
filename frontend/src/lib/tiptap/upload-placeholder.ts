import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { UploadPlaceholderComponent } from "@/components/common/upload-placeholder-component";

export interface UploadPlaceholderOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    uploadPlaceholder: {
      /**
       * Insert an upload placeholder node at the current cursor position
       */
      setUploadPlaceholder: (placeholderId: string, filename: string) => ReturnType;
      /**
       * Remove an upload placeholder node by ID
       */
      removeUploadPlaceholder: (placeholderId: string) => ReturnType;
    };
  }
}

export const UploadPlaceholder = Node.create<UploadPlaceholderOptions>({
  name: "uploadPlaceholder",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  atom: true,

  addAttributes() {
    return {
      placeholderId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-placeholder-id"),
        renderHTML: (attributes) => {
          if (!attributes.placeholderId) {
            return {};
          }
          return {
            "data-placeholder-id": attributes.placeholderId,
          };
        },
      },
      filename: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-filename"),
        renderHTML: (attributes) => {
          if (!attributes.filename) {
            return {};
          }
          return {
            "data-filename": attributes.filename,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": this.name }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(UploadPlaceholderComponent);
  },

  addCommands() {
    return {
      setUploadPlaceholder:
        (placeholderId: string, filename: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              placeholderId,
              filename,
            },
          });
        },
      removeUploadPlaceholder:
        (placeholderId: string) =>
        ({ commands, tr, state }) => {
          const { doc } = state;
          let found = false;

          doc.descendants((node, pos) => {
            if (
              node.type.name === this.name &&
              node.attrs.placeholderId === placeholderId
            ) {
              commands.deleteRange({ from: pos, to: pos + node.nodeSize });
              found = true;
              return false;
            }
            return true;
          });

          return found;
        },
    };
  },
});
