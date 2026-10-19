import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import Tiptap from "../component/FormComponent/TipTabEditor";
import IndentExtension, { MAX_INDENT } from "../component/FormComponent/IndentExtension";

jest.mock("@heroui/react", () => ({
  Select: ({ items, selectedKeys, onChange, placeholder, "aria-label": ariaLabel }: any) => (
    <select
      aria-label={ariaLabel ?? placeholder}
      value={selectedKeys?.[0] ?? ""}
      onChange={onChange}
    >
      {items?.map((item: any) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  ),
  SelectItem: ({ children, ...props }: any) => <option {...props}>{children}</option>,
  Modal: ({ children, isOpen }: any) => (isOpen ? <div>{children}</div> : null),
  ModalContent: ({ children }: any) => <div>{typeof children === "function" ? children() : children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onPress, ...props }: any) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Input: (props: any) => <input {...props} />,
  Form: ({ children, onSubmit, ...props }: any) => (
    <form onSubmit={onSubmit} {...props}>
      {children}
    </form>
  ),
}));

const docWith = (indent = 0) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { indent },
      content: [{ type: "text", text: "Sample text" }],
    },
  ],
});

const lastIndent = (onChange: jest.Mock) =>
  onChange.mock.calls[onChange.mock.calls.length - 1][0].content[0].attrs.indent;

const makeEditor = (indent = 0) =>
  new Editor({
    extensions: [Document, Paragraph, Text, IndentExtension],
    content: docWith(indent),
  });

// jsdom has no layout, but ProseMirror measures the caret when scrolling it into view
beforeAll(() => {
  const rect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) };
  const rects = Object.assign([rect], { item: () => rect });
  Element.prototype.getClientRects = () => rects as unknown as DOMRectList;
  Range.prototype.getClientRects = () => rects as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => rect as DOMRect;
});

const item = (text: string) => ({
  type: "listItem",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
const listDoc = (indent = 0) => ({
  type: "doc",
  content: [{ type: "bulletList", attrs: { indent }, content: [item("One"), item("Two")] }],
});
const makeListEditor = (indent = 0) =>
  new Editor({
    extensions: [Document, Paragraph, Text, BulletList, ListItem, IndentExtension],
    content: listDoc(indent),
  });
// Caret positions: <ul>0 <li>1 <p>2 "One" 3–6 </p>6 </li>7 <li>8 <p>9 "Two" 10
const FIRST_ITEM = 3;
const SECOND_ITEM = 10;
const list = (editor: Editor) => editor.getJSON().content![0];

describe("TipTabEditor indent", () => {
  it("indents and outdents the line with the toolbar buttons", async () => {
    const onChange = jest.fn();
    render(<Tiptap value={docWith()} readonly={false} onChange={onChange} />);

    expect(screen.getByTitle(/Outdent/)).toBeDisabled();

    fireEvent.click(screen.getByTitle(/^Indent/));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(lastIndent(onChange)).toBe(1);

    fireEvent.click(screen.getByTitle(/Outdent/));
    await waitFor(() => expect(lastIndent(onChange)).toBe(0));
  });

  it("renders saved indentation in readonly mode", () => {
    const { container } = render(<Tiptap value={docWith(2)} readonly />);
    expect(container.querySelector("p[data-indent='2']")).toBeInTheDocument();
  });

  it("outputs a responsive padding that is capped at half the width", () => {
    const editor = makeEditor(3);
    // Read the attributes before jsdom (which can't parse min()/var()) drops the style
    const paragraph = editor.state.doc.firstChild!;
    const [, attrs] = paragraph.type.spec.toDOM!(paragraph) as [string, Record<string, string>];
    expect(attrs.style).toBe("padding-left: min(calc(3 * var(--editor-indent-step, 2em)), 50%)");
    editor.destroy();
  });

  it("Tab indents at the start of a line but not in the middle of text", () => {
    const editor = makeEditor();

    editor.commands.setTextSelection(1);
    expect(editor.commands.keyboardShortcut("Tab")).toBe(true);
    expect(editor.getJSON().content?.[0].attrs?.indent).toBe(1);

    // Mid-sentence Tab is left to the browser so focus can move on
    editor.commands.setTextSelection(4);
    editor.commands.keyboardShortcut("Tab");
    expect(editor.getJSON().content?.[0].attrs?.indent).toBe(1);

    editor.commands.keyboardShortcut("Shift-Tab");
    expect(editor.getJSON().content?.[0].attrs?.indent).toBe(0);
    editor.destroy();
  });

  it("Backspace at the start of an indented line removes one level", () => {
    const editor = makeEditor(2);
    editor.commands.setTextSelection(1);
    editor.commands.keyboardShortcut("Backspace");
    expect(editor.getJSON().content?.[0].attrs?.indent).toBe(1);
    editor.destroy();
  });

  it("never goes above the maximum level", () => {
    const editor = makeEditor(MAX_INDENT);
    expect(editor.commands.indent()).toBe(false);
    expect(editor.getJSON().content?.[0].attrs?.indent).toBe(MAX_INDENT);
    editor.destroy();
  });

  describe("lists", () => {
    it("indents the whole list when the first item can't nest", () => {
      const editor = makeListEditor();
      editor.commands.setTextSelection(FIRST_ITEM);
      expect(editor.commands.indent()).toBe(true);
      expect(list(editor).attrs?.indent).toBe(1);
      expect(list(editor).content).toHaveLength(2);
      editor.destroy();
    });

    it("nests a later item under the one above instead", () => {
      const editor = makeListEditor();
      editor.commands.setTextSelection(SECOND_ITEM);
      editor.commands.keyboardShortcut("Tab");
      expect(list(editor).attrs?.indent).toBe(0);
      expect(list(editor).content).toHaveLength(1);
      expect(list(editor).content![0].content![1].type).toBe("bulletList");
      editor.destroy();
    });

    it("Tab indents a list item even in the middle of its text", () => {
      const editor = makeListEditor();
      editor.commands.setTextSelection(FIRST_ITEM + 2);
      expect(editor.commands.keyboardShortcut("Tab")).toBe(true);
      expect(list(editor).attrs?.indent).toBe(1);
      editor.destroy();
    });

    it("Shift+Tab removes the list's indent before lifting items out", () => {
      const editor = makeListEditor(1);
      editor.commands.setTextSelection(FIRST_ITEM);

      editor.commands.keyboardShortcut("Shift-Tab");
      expect(list(editor).type).toBe("bulletList");
      expect(list(editor).attrs?.indent).toBe(0);

      editor.commands.keyboardShortcut("Shift-Tab");
      expect(list(editor).type).toBe("paragraph");
      editor.destroy();
    });

    it("uses margin for lists so the bullets keep their space", () => {
      const editor = makeListEditor(2);
      const node = editor.state.doc.firstChild!;
      const [, attrs] = node.type.spec.toDOM!(node) as [string, Record<string, string>];
      expect(attrs.style).toBe(
        "margin-left: calc(0.4rem + min(calc(2 * var(--editor-indent-step, 2em)), 50%))",
      );
      editor.destroy();
    });

    it("enables the toolbar buttons for list items", async () => {
      const onChange = jest.fn();
      render(<Tiptap value={listDoc(1)} readonly={false} onChange={onChange} />);
      expect(screen.getByTitle(/^Indent/)).not.toBeDisabled();
      expect(screen.getByTitle(/Outdent/)).not.toBeDisabled();
    });
  });

  describe("undo / redo", () => {
    it("undoes and redoes an indent from the toolbar", async () => {
      const onChange = jest.fn();
      render(<Tiptap value={docWith()} readonly={false} onChange={onChange} />);

      // Both copies (mobile header + desktop row) start disabled: nothing to undo yet
      screen.getAllByTitle(/^Undo/).forEach((b) => expect(b).toBeDisabled());
      screen.getAllByTitle(/^Redo/).forEach((b) => expect(b).toBeDisabled());

      fireEvent.click(screen.getByTitle(/^Indent/));
      await waitFor(() => expect(lastIndent(onChange)).toBe(1));

      fireEvent.click(screen.getAllByTitle(/^Undo/)[0]);
      await waitFor(() => expect(lastIndent(onChange)).toBe(0));

      const redo = screen.getAllByTitle(/^Redo/)[0];
      expect(redo).not.toBeDisabled();
      fireEvent.click(redo);
      await waitFor(() => expect(lastIndent(onChange)).toBe(1));
    });

    it("does not let undo wipe out content loaded from props", () => {
      const { rerender } = render(<Tiptap value={docWith()} readonly={false} onChange={jest.fn()} />);
      rerender(<Tiptap value={docWith(3)} readonly={false} onChange={jest.fn()} />);
      screen.getAllByTitle(/^Undo/).forEach((b) => expect(b).toBeDisabled());
    });
  });
});
