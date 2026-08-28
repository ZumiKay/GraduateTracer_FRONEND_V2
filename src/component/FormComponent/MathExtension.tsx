import React, { useEffect, useMemo, useRef, useState } from "react";
import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import katex from "katex";

// ── Inline Math NodeView ──────────────────────────────────────────────────────

const InlineMathView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  editor,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.attrs.latex as string);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(node.attrs.latex);
  }, [node.attrs.latex]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    updateAttributes({ latex: draft });
    setEditing(false);
  };

  const rendered = useMemo(
    () =>
      katex.renderToString(draft || "?", {
        throwOnError: false,
        displayMode: false,
      }),
    [draft],
  );

  return (
    <NodeViewWrapper as="span">
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(node.attrs.latex as string);
              setEditing(false);
            }
          }}
          className="border border-blue-400 rounded px-1 text-sm font-mono bg-white"
          style={{ width: Math.max(80, draft.length * 8) + "px" }}
        />
      ) : (
        <span
          className={`math-inline rounded px-0.5 transition-colors ${
            selected ? "ring-2 ring-blue-400 bg-blue-50" : ""
          } ${editor.isEditable ? "cursor-pointer hover:bg-blue-50" : ""}`}
          onClick={() => {
            if (editor.isEditable) setEditing(true);
          }}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )}
    </NodeViewWrapper>
  );
};

// ── Display Math NodeView ─────────────────────────────────────────────────────

const DisplayMathView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  editor,
}) => {
  const [editing, setEditing] = useState(!node.attrs.latex);
  const [draft, setDraft] = useState(node.attrs.latex as string);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(node.attrs.latex);
  }, [node.attrs.latex]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const commit = () => {
    if (draft.trim()) {
      updateAttributes({ latex: draft });
      setEditing(false);
    }
  };

  const rendered = useMemo(
    () =>
      katex.renderToString(draft || "?", {
        throwOnError: false,
        displayMode: true,
      }),
    [draft],
  );

  return (
    <NodeViewWrapper>
      <div className="my-2">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setDraft(node.attrs.latex as string);
                setEditing(false);
              }
            }}
            className="w-full border border-blue-400 rounded p-2 text-sm font-mono bg-white resize-none"
            rows={3}
            placeholder="Enter LaTeX… (Ctrl+Enter to confirm)"
          />
        ) : (
          <div
            className={`text-center py-2 rounded transition-colors ${
              selected ? "ring-2 ring-blue-400 bg-blue-50" : ""
            } ${editor.isEditable ? "cursor-pointer hover:bg-blue-50" : ""}`}
            onClick={() => {
              if (editor.isEditable) setEditing(true);
            }}
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

// ── InlineMath Extension ──────────────────────────────────────────────────────

export const InlineMath = Node.create({
  name: "inlineMath",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return { latex: { default: "" } };
  },

  parseHTML() {
    return [{ tag: "span[data-inline-math]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ "data-inline-math": node.attrs.latex }, HTMLAttributes),
    ];
  },

  // Converts $...$ to an inline math node when typing
  addInputRules() {
    return [
      new InputRule({
        find: /\$([^$\n]+)\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          if (!latex?.trim()) return null;
          const node = this.type.create({ latex });
          state.tr.replaceWith(range.from, range.to, node);
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineMathView);
  },
});

// ── DisplayMath Extension ─────────────────────────────────────────────────────

export const DisplayMath = Node.create({
  name: "displayMath",
  group: "block",
  atom: true,

  addAttributes() {
    return { latex: { default: "" } };
  },

  parseHTML() {
    return [{ tag: "div[data-display-math]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-display-math": node.attrs.latex },
        HTMLAttributes,
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DisplayMathView);
  },
});
