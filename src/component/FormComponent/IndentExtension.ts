import { Extension, type Editor } from "@tiptap/core";
import type { EditorState, Transaction } from "@tiptap/pm/state";

export const MAX_INDENT = 8;
const TEXT_TYPES = ["paragraph", "heading"];
const LIST_TYPES = ["bulletList", "orderedList"];
const INDENT_TYPES = [...TEXT_TYPES, ...LIST_TYPES];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      /** Indent the current block. In a list: nest the item, or indent the whole list
       * when the item can't nest (e.g. the first item) */
      indent: () => ReturnType;
      /** Outdent the current block. In a list: remove the list's own indent first,
       * then lift the item out */
      outdent: () => ReturnType;
    };
  }
}

const clampIndent = (value: number) => Math.min(MAX_INDENT, Math.max(0, value));

// Closest bullet/ordered list around the caret
const findList = (state: EditorState) => {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (LIST_TYPES.includes(node.type.name)) return { node, pos: $from.before(depth) };
  }
  return null;
};

/** Indent level at the caret: the list's level inside a list, otherwise the line's */
export const getCurrentIndent = (editor: Editor): number => {
  const list = findList(editor.state);
  if (list) return Number(list.node.attrs.indent) || 0;
  const parent = editor.state.selection.$from.parent;
  if (!TEXT_TYPES.includes(parent.type.name)) return 0;
  return Number(parent.attrs.indent) || 0;
};

// Change the indent of the list around the caret
const shiftListIndent = (
  state: EditorState,
  tr: Transaction,
  delta: number,
  dispatch?: (tr: Transaction) => void,
) => {
  const list = findList(state);
  if (!list) return false;
  const current = Number(list.node.attrs.indent) || 0;
  const next = clampIndent(current + delta);
  if (next === current) return false;
  if (dispatch) tr.setNodeMarkup(list.pos, undefined, { ...list.node.attrs, indent: next });
  return true;
};

// Change the indent of every paragraph/heading/list touched by the selection
// (lists move as one block, so their inner lines aren't indented separately)
const shiftIndent = (
  state: EditorState,
  tr: Transaction,
  delta: number,
  dispatch?: (tr: Transaction) => void,
) => {
  const { from, to } = state.selection;
  let changed = false;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!INDENT_TYPES.includes(node.type.name)) return true;

    const current = Number(node.attrs.indent) || 0;
    const next = clampIndent(current + delta);
    if (next !== current) {
      changed = true;
      if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
    }
    return false;
  });

  return changed;
};

const IndentExtension = Extension.create({
  name: "indent",
  // Run before ListItem's own Tab/Shift-Tab so list indenting goes through our commands
  priority: 101,

  addGlobalAttributes() {
    const indentAttribute = (isList: boolean) => ({
      indent: {
        default: 0,
        parseHTML: (el: HTMLElement) =>
          clampIndent(parseInt(el.getAttribute("data-indent") ?? "0", 10) || 0),
        renderHTML: (attrs: Record<string, unknown>) => {
          const level = Number(attrs.indent) || 0;
          if (!level) return {};
          // Step size comes from CSS so it can shrink on small screens; capped at 50%
          // of the width so text never gets squeezed into a sliver on phones
          const offset = `min(calc(${level} * var(--editor-indent-step, 2em)), 50%)`;
          return {
            "data-indent": level,
            // Lists use margin so their own padding (room for the bullets) stays intact;
            // 0.4rem is the list's base left margin from input.css
            style: isList ? `margin-left: calc(0.4rem + ${offset})` : `padding-left: ${offset}`,
          };
        },
      },
    });

    return [
      { types: TEXT_TYPES, attributes: indentAttribute(false) },
      { types: LIST_TYPES, attributes: indentAttribute(true) },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, state, tr, dispatch, commands }) => {
          if (editor.isActive("listItem")) {
            if (editor.can().sinkListItem("listItem")) return commands.sinkListItem("listItem");
            return shiftListIndent(state, tr, 1, dispatch);
          }
          return shiftIndent(state, tr, 1, dispatch);
        },
      outdent:
        () =>
        ({ editor, state, tr, dispatch, commands }) => {
          if (editor.isActive("listItem")) {
            if (shiftListIndent(state, tr, -1, dispatch)) return true;
            return commands.liftListItem("listItem");
          }
          return shiftIndent(state, tr, -1, dispatch);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Outside lists, Tab only indents at the start of a line or over a selection, so
      // pressing Tab mid-sentence still moves focus to the next field (keyboard
      // accessibility). Inside lists Tab always indents, as in other editors.
      Tab: ({ editor }) => {
        if (editor.isActive("listItem")) return editor.commands.indent();
        const { selection } = editor.state;
        if (selection.empty && selection.$from.parentOffset !== 0) return false;
        return editor.commands.indent();
      },
      "Shift-Tab": ({ editor }) => editor.commands.outdent(),
      "Mod-]": ({ editor }) => editor.commands.indent(),
      "Mod-[": ({ editor }) => editor.commands.outdent(),
      // Backspace at the very start of an indented line removes one indent level first
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        if (!selection.empty || selection.$from.parentOffset !== 0) return false;
        if (editor.isActive("listItem") || getCurrentIndent(editor) === 0) return false;
        return editor.commands.outdent();
      },
    };
  },
});

export default IndentExtension;
