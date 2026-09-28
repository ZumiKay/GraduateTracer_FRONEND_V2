// src/Tiptap.tsx
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { ListIcon } from "../svg/GeneralIcon";
import Selection from "./Selection";
import { SelectionType } from "../../types/Global.types";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Code from "@tiptap/extension-code";
import { LinkIcon } from "../svg/InputIcon";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddLinkModal } from "../Modal/Modal";
import ModalWrapper from "../Modal/Modal";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { FiChevronDown } from "react-icons/fi";

const AlphaOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listType: {
        default: "decimal",
        parseHTML: (el) => el.getAttribute("data-list-type") ?? "decimal",
        renderHTML: (attrs) => ({
          "data-list-type": attrs.listType,
          ...((attrs.listType === "lower-alpha" ||
            attrs.listType === "upper-alpha") && {
            style: `list-style-type: ${attrs.listType}`,
          }),
        }),
      },
    };
  },
});
import ListItem from "@tiptap/extension-list-item";
import ListKeymap from "@tiptap/extension-list-keymap";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import renderMathInElement from "katex/contrib/auto-render";
import { InlineMath, DisplayMath } from "./MathExtension";
import "../FormComponent/input.css";

//Quick heading items dropdown
const SLASH_ITEMS = [
  { label: "Normal Text", level: 0 },
  { label: "Heading 1", level: 1 },
  { label: "Heading 2", level: 2 },
  { label: "Heading 3", level: 3 },
] as const;

type SlashLevel = (typeof SLASH_ITEMS)[number]["level"];

const SlashCommandExtension = Extension.create({
  name: "slashCommand",
  addStorage() {
    return {
      onNavigate: null as ((dir: 1 | -1) => void) | null,
      onSelect: null as (() => void) | null,
      onClose: null as (() => void) | null,
      isOpen: false,
    };
  },
  addKeyboardShortcuts() {
    return {
      Space: ({ editor }) => {
        const { $from } = editor.state.selection;
        if ($from.node().textContent === "/") {
          const nodeEnd = $from.end();
          editor
            .chain()
            .focus()
            .deleteRange({ from: nodeEnd - 1, to: nodeEnd })
            .setParagraph()
            .run();
          return true;
        }
        return false;
      },
      ArrowDown: ({ editor }) => {
        if (!editor.storage.slashCommand.isOpen) return false;
        editor.storage.slashCommand.onNavigate?.(1);
        return true;
      },
      ArrowUp: ({ editor }) => {
        if (!editor.storage.slashCommand.isOpen) return false;
        editor.storage.slashCommand.onNavigate?.(-1);
        return true;
      },
      Enter: ({ editor }) => {
        if (!editor.storage.slashCommand.isOpen) return false;
        editor.storage.slashCommand.onSelect?.();
        return true;
      },
      Escape: ({ editor }) => {
        if (!editor.storage.slashCommand.isOpen) return false;
        editor.storage.slashCommand.onClose?.();
        return true;
      },
    };
  },
});

// define your extension array
const extensions = [
  Placeholder.configure({ placeholder: "Question" }),
  Paragraph,
  Document,
  Text,
  Bold,
  Italic,
  Code,
  AlphaOrderedList,
  BulletList,
  Heading.configure({ levels: [1, 2, 3] }),
  ListItem,
  ListKeymap,
  TextAlign,
  InlineMath,
  DisplayMath,
  SlashCommandExtension,
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
    protocols: ["http", "https"],
    isAllowedUri: (url, ctx) => {
      try {
        const parsedUrl = url.includes(":")
          ? new URL(url)
          : new URL(`${ctx.defaultProtocol}://${url}`);

        if (!ctx.defaultValidate(parsedUrl.href)) {
          return false;
        }
        const disallowedProtocols = ["ftp", "file"];
        const protocol = parsedUrl.protocol.replace(":", "");

        if (disallowedProtocols.includes(protocol)) {
          return false;
        }
        const allowedProtocols = ctx.protocols.map((p) =>
          typeof p === "string" ? p : p.scheme,
        );

        if (!allowedProtocols.includes(protocol)) {
          return false;
        }

        const disallowedDomains = [
          "example-phishing.com",
          "malicious-site.net",
        ];
        const domain = parsedUrl.hostname;

        if (disallowedDomains.includes(domain)) {
          return false;
        }
        return true;
      } catch (error) {
        console.log("Error Link", error);
        return false;
      }
    },
  }),
];

const HeaderOptions: Array<SelectionType<string>> = [
  { label: "None", value: "0" },
  { label: "H1", value: "1" },
  { label: "H2", value: "2" },
  { label: "H3", value: "3" },
];

interface TipTapProps {
  value?: JSONContent;
  onChange?: (val: JSONContent) => void;
  qidx?: number;
  readonly?: boolean;
}

// ─── Help Modal ───────────────────────────────────────────────────────────────
const MATH_EXAMPLES = [
  { syntax: "$x^2 + y^2 = z^2$", desc: "Inline math" },
  { syntax: "$$\\int_0^\\infty e^{-x}\\,dx$$", desc: "Display (block) math" },
  { syntax: "$\\frac{a}{b}$", desc: "Fraction" },
  { syntax: "$\\sqrt{x}$", desc: "Square root" },
  { syntax: "$\\sum_{i=1}^{n} i$", desc: "Summation" },
  { syntax: "$\\vec{v}$", desc: "Vector" },
  { syntax: "$\\alpha, \\beta, \\gamma$", desc: "Greek letters" },
  { syntax: "$\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$", desc: "Matrix" },
];

const EDITOR_SHORTCUTS = [
  { key: "⌘B / Ctrl+B", desc: "Bold" },
  { key: "⌘I / Ctrl+I", desc: "Italic" },
  { key: "/", desc: "Open heading picker" },
  { key: "∑ button", desc: "Insert display math block" },
];

function EditorHelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <ModalWrapper
      isOpen={open}
      onClose={onClose}
      size="2xl"
      title="✏️  Editor Help"
    >
      <div className="flex flex-col gap-y-6 pb-4">
        {/* Keyboard shortcuts */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Keyboard Shortcuts
          </h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {EDITOR_SHORTCUTS.map((s) => (
                <tr
                  key={s.key}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-1.5 pr-4 font-mono bg-gray-50 px-2 rounded text-xs text-gray-700 whitespace-nowrap">
                    {s.key}
                  </td>
                  <td className="py-1.5 pl-3 text-gray-600">{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Math / LaTeX reference */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Math (LaTeX / KaTeX)
            </h3>
            <a
              href="https://katex.org/docs/supported"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Full KaTeX reference ↗
            </a>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Wrap inline math with <code className="bg-gray-100 px-1 rounded">$…$</code>{" "}
            and display (block) math with{" "}
            <code className="bg-gray-100 px-1 rounded">$$…$$</code>.
          </p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                <th className="pb-1 font-medium">Syntax</th>
                <th className="pb-1 font-medium pl-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {MATH_EXAMPLES.map((ex) => (
                <tr
                  key={ex.syntax}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-1.5 pr-4 font-mono text-xs bg-gray-50 px-2 rounded text-purple-700 whitespace-nowrap">
                    {ex.syntax}
                  </td>
                  <td className="py-1.5 pl-3 text-gray-600">{ex.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Extra links */}
        <section className="flex flex-wrap gap-3 pt-1">
          <a
            href="https://katex.org/docs/supported"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            📐 KaTeX supported functions
          </a>
          <a
            href="https://en.wikibooks.org/wiki/LaTeX/Mathematics"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            📖 LaTeX Mathematics guide
          </a>
          <a
            href="https://tiptap.dev/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            🖊️ Tiptap docs
          </a>
        </section>
      </div>
    </ModalWrapper>
  );
}

const KATEX_DELIMITERS = [
  { left: "$$", right: "$$", display: true },
  { left: "$", right: "$", display: false },
];

const Tiptap = ({ value, onChange, readonly }: TipTapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const slashMenuIndexRef = useRef(0);
  const applySlashRef = useRef<(level: SlashLevel) => void>(() => {});

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: `w-full min-h-[40px] text-left h-fit outline-none ${
          readonly ? "" : "readwrite border-b-2 border-gray-300 bg-gray-50"
        }`,
      },
      editable: () => !readonly,
    },
    onUpdate: () => {
      if (!editor) return;

      const jsonValue = { ...editor.getJSON() };
      if (onChange) onChange(jsonValue);

      const { $from } = editor.state.selection;
      const nodeText = $from.node().textContent;

      if (nodeText === "/") {
        const coords = editor.view.coordsAtPos(editor.state.selection.from);
        editor.storage.slashCommand.isOpen = true;
        setSlashMenuPos({ top: coords.bottom, left: coords.left });
        setSlashMenuOpen(true);
        slashMenuIndexRef.current = 0;
        setSlashMenuIndex(0);
      } else {
        editor.storage.slashCommand.isOpen = false;
        setSlashMenuOpen(false);
      }
    },
    onSelectionUpdate: () => {
      setheader(activeHeading());
    },
  });

  // Updated every render so callbacks always have latest editor/state
  applySlashRef.current = (level: SlashLevel) => {
    if (!editor) return;
    const { $from } = editor.state.selection;
    if ($from.node().textContent !== "/") return;

    const nodeEnd = $from.end();
    const chain = editor
      .chain()
      .focus()
      .deleteRange({ from: nodeEnd - 1, to: nodeEnd });

    if (level === 0) {
      chain.setParagraph().run();
    } else {
      chain.setHeading({ level }).run();
    }

    editor.storage.slashCommand.isOpen = false;
    setSlashMenuOpen(false);
    slashMenuIndexRef.current = 0;
    setSlashMenuIndex(0);
  };

  useEffect(() => {
    if (!editor) return;

    editor.storage.slashCommand.onNavigate = (dir: 1 | -1) => {
      const next =
        (slashMenuIndexRef.current + dir + SLASH_ITEMS.length) %
        SLASH_ITEMS.length;
      slashMenuIndexRef.current = next;
      setSlashMenuIndex(next);
    };

    editor.storage.slashCommand.onSelect = () => {
      applySlashRef.current(SLASH_ITEMS[slashMenuIndexRef.current].level);
    };

    editor.storage.slashCommand.onClose = () => {
      const { $from } = editor.state.selection;
      if ($from.node().textContent === "/") {
        const nodeEnd = $from.end();
        editor
          .chain()
          .focus()
          .deleteRange({ from: nodeEnd - 1, to: nodeEnd })
          .run();
      } else {
        editor.chain().focus().run();
      }
      editor.storage.slashCommand.isOpen = false;
      setSlashMenuOpen(false);
    };
  }, [editor]);

  const activeHeading = useCallback(() => {
    let value = "";

    if (editor?.isActive("heading", { level: 1 })) {
      value = "1";
    } else if (editor?.isActive("heading", { level: 2 })) {
      value = "2";
    } else if (editor?.isActive("heading", { level: 3 })) {
      value = "3";
    } else value = "0";

    return value;
  }, [editor]);

  const [header, setheader] = useState<string>("0");

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const [addlink, setaddlink] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isFormatToolsOpen, setIsFormatToolsOpen] = useState(true);

  useEffect(() => {
    if (editor && JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(value as never);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!readonly || !containerRef.current) return;
    renderMathInElement(containerRef.current, {
      delimiters: KATEX_DELIMITERS,
      throwOnError: false,
    });
  }, [value, readonly]);

  if (!editor) return null;

  const applyStyle = (style: "bold" | "italic" | "code") => {
    if (!editor) return;

    switch (style) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "code":
        editor.chain().focus().toggleCode().run();
        break;

      default:
        break;
    }
  };

  const isStyleActive = (type: "code" | "bold" | "italic") =>
    editor?.isActive(type);

  const isLinkSelection = () => editor?.isActive("link");
  const listactive = (type: "bulletList" | "orderedList") =>
    editor?.isActive(type);
  const toggleListOrder = () => {
    if (listactive("bulletList")) {
      editor?.chain().focus().toggleOrderedList().run();
    } else if (listactive("orderedList")) {
      editor?.chain().focus().liftListItem("listItem").run();
    } else {
      editor?.chain().focus().toggleBulletList().run();
    }
  };

  const isAlphaList = () =>
    editor?.isActive("orderedList", { listType: "lower-alpha" });

  const toggleAlphaList = () => {
    if (isAlphaList()) {
      editor?.chain().focus().liftListItem("listItem").run();
    } else if (listactive("orderedList")) {
      editor
        ?.chain()
        .focus()
        .updateAttributes("orderedList", { listType: "lower-alpha" })
        .run();
    } else {
      editor
        ?.chain()
        .focus()
        .toggleOrderedList()
        .updateAttributes("orderedList", { listType: "lower-alpha" })
        .run();
    }
  };

  const isUpperAlphaList = () =>
    editor?.isActive("orderedList", { listType: "upper-alpha" });

  const toggleUpperAlphaList = () => {
    if (isUpperAlphaList()) {
      editor?.chain().focus().liftListItem("listItem").run();
    } else if (listactive("orderedList")) {
      editor
        ?.chain()
        .focus()
        .updateAttributes("orderedList", { listType: "upper-alpha" })
        .run();
    } else {
      editor
        ?.chain()
        .focus()
        .toggleOrderedList()
        .updateAttributes("orderedList", { listType: "upper-alpha" })
        .run();
    }
  };

  const toggleHeader = (val: number) => {
    if (!val) {
      return editor.chain().focus().setParagraph().run();
    } else
      return editor
        .chain()
        .focus()
        .toggleHeading({
          level: val as never,
        })
        .run();
  };

  return (
    <>
      {addlink && (
        <AddLinkModal
          editorState={editor}
          isLinkInSelection={isLinkSelection() as boolean}
          open={addlink}
          setopen={setaddlink}
        />
      )}

      <EditorHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Quick header options menu */}
      {slashMenuOpen && !readonly && (
        <ul
          style={{ top: slashMenuPos.top + 4, left: slashMenuPos.left }}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] list-none"
        >
          {SLASH_ITEMS.map((item, idx) => (
            <li className="w-full h-full" key={item.level}>
              <button
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  idx === slashMenuIndex
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySlashRef.current(item.level);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={containerRef} className="relative w-full max-w-full min-w-0 h-fit flex flex-col gap-y-3 sm:gap-y-5">
        <EditorContent editor={editor} tabIndex={-1} aria-hidden={false} className="w-full max-w-full min-w-0 overflow-x-hidden" />
        {!readonly && (
          <div
            className={`tiptap_floating_toolbar transition-all duration-300 ${
              // Desktop (>= lg): clean in-flow toolbar below editor
              "lg:relative lg:bottom-auto lg:right-auto lg:self-auto lg:ml-0 lg:z-auto lg:w-full lg:max-w-full lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:mt-1 " +
              // Mobile & Tablet (< lg): right-side floating container docked at right side of editor
              "max-lg:sticky max-lg:bottom-3 max-lg:right-0 max-lg:self-end max-lg:ml-auto max-lg:z-30 " +
              (isFormatToolsOpen
                ? "max-lg:w-[280px] sm:max-lg:w-[320px] max-lg:max-w-[calc(100vw-2rem)] "
                : "max-lg:w-auto ") +
              "max-lg:bg-white/95 max-lg:dark:bg-gray-800/95 max-lg:backdrop-blur-md max-lg:rounded-2xl max-lg:border-2 " +
              "max-lg:border-gray-200/90 dark:max-lg:border-gray-700/80 max-lg:shadow-2xl max-lg:mt-2 max-lg:overflow-hidden"
            }`}
            style={{
              boxShadow: editor?.isFocused
                ? "0 10px 25px -5px rgba(37, 67, 54, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.15)"
                : undefined,
            }}
          >
            {/* Mobile & Tablet Header with quick hide/show */}
            {isFormatToolsOpen && (
              <div className="max-lg:flex lg:hidden items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 tracking-wide uppercase">
                    Format Tools
                  </span>
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsFormatToolsOpen(false)}
                  className="px-2 py-0.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer active:scale-95"
                  aria-label="Collapse formatting tools"
                >
                  <span>Hide</span>
                  <FiChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                </button>
              </div>
            )}

            {/* Tools Area */}
            {isFormatToolsOpen ? (
              <div className="w-full min-w-0 max-w-full flex flex-col lg:flex-row lg:items-center lg:gap-x-2.5 cursor-default p-2.5 lg:p-0">
                {/* Heading Select */}
                <div className="w-full lg:w-[145px] shrink-0 mb-2 lg:mb-0">
                  <Selection
                    className="w-full"
                    size="sm"
                    items={HeaderOptions}
                    selectedKeys={[header]}
                    onChange={(val) => {
                      const { value } = val.target;
                      setheader(value);
                      toggleHeader(Number(value));
                    }}
                    placeholder="Heading"
                    aria-label="Select Heading Level"
                  />
                </div>

                {/* Formatting Buttons: Grid on mobile/tablet, row on desktop */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full lg:flex lg:flex-row lg:items-center lg:gap-x-2 lg:w-auto">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyStyle("bold")}
                    title="Bold (⌘B / Ctrl+B)"
                    aria-label="Bold"
                    className={`font-bold h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors cursor-pointer select-none active:scale-95 text-sm lg:text-xs ${
                      isStyleActive("bold")
                        ? "bg-primary text-white shadow-sm"
                        : "bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20"
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyStyle("italic")}
                    title="Italic (⌘I / Ctrl+I)"
                    aria-label="Italic"
                    className={`font-bold italic h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors cursor-pointer select-none active:scale-95 text-sm lg:text-xs ${
                      isStyleActive("italic")
                        ? "bg-primary text-white shadow-sm"
                        : "bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20"
                    }`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyStyle("code")}
                    title="Inline Code"
                    aria-label="Inline Code"
                    className={`font-bold h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors cursor-pointer select-none active:scale-95 text-sm lg:text-xs ${
                      isStyleActive("code")
                        ? "bg-primary text-white shadow-sm"
                        : "bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20"
                    }`}
                  >
                    {`</>`}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setaddlink(true)}
                    title="Insert Link"
                    aria-label="Insert Link"
                    className={`font-bold h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors cursor-pointer select-none active:scale-95 ${
                      isLinkSelection()
                        ? "bg-primary text-white shadow-sm"
                        : "bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20"
                    }`}
                  >
                    <LinkIcon
                      width={"18px"}
                      height={"18px"}
                      fill={isLinkSelection() ? "#fff" : "#000000"}
                    />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggleListOrder()}
                    title="List (Bullet / Numbered)"
                    aria-label="List"
                    className={`font-bold h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors cursor-pointer select-none active:scale-95 ${
                      listactive("bulletList") || listactive("orderedList")
                        ? "bg-primary text-white shadow-sm"
                        : "bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20"
                    }`}
                  >
                    <ListIcon
                      fill={
                        listactive("bulletList") || listactive("orderedList")
                          ? "#fff"
                          : "#000000"
                      }
                      width={"18px"}
                      height={"18px"}
                    />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    title="Alphabetical list (a, b, c…)"
                    aria-label="Alphabetical list lower"
                    onClick={() => toggleAlphaList()}
                    className={`font-bold h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors text-sm lg:text-xs cursor-pointer select-none active:scale-95 ${
                      isAlphaList()
                        ? "bg-primary text-white shadow-sm"
                        : "bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20"
                    }`}
                  >
                    a.
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    title="Alphabetical list (A, B, C…)"
                    aria-label="Alphabetical list upper"
                    onClick={() => toggleUpperAlphaList()}
                    className={`font-bold h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors text-sm lg:text-xs cursor-pointer select-none active:scale-95 ${
                      isUpperAlphaList()
                        ? "bg-primary text-white shadow-sm"
                        : "bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20"
                    }`}
                  >
                    A.
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    title="Insert math block (display)"
                    aria-label="Insert math block"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .insertContent({ type: "displayMath", attrs: { latex: "" } })
                        .run()
                    }
                    className="font-bold h-10 w-full lg:w-[32px] lg:h-[32px] grid place-content-center rounded-xl lg:rounded-lg transition-colors bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20 text-base lg:text-sm cursor-pointer select-none active:scale-95"
                  >
                    ∑
                  </button>
                  {/* Help button (spans 2 columns on mobile/tablet to complete the 5-col grid) */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    title="Editor Help & LaTeX Reference"
                    aria-label="Editor Help"
                    onClick={() => setHelpOpen(true)}
                    className="max-lg:col-span-2 font-bold h-10 w-full lg:w-[32px] lg:h-[32px] flex items-center justify-center rounded-xl lg:rounded-lg transition-colors bg-lightsucess dark:bg-gray-700 text-black dark:text-white hover:bg-primary/20 text-base lg:text-sm select-none cursor-pointer active:scale-95"
                  >
                    <span>?</span>
                    <span className="text-xs font-semibold ml-1 max-lg:inline lg:hidden">
                      Help
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Collapsed View on Mobile/Tablet */
              <div className="max-lg:flex lg:hidden items-center p-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsFormatToolsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-primary active:scale-95 transition-all shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs font-semibold"
                  aria-label="Expand"
                  title="Expand formatting tools"
                >
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-bold text-primary">Aa</span>
                  <span>Tools</span>
                  <span className="text-[11px] text-primary font-medium ml-0.5">
                    Expand
                  </span>
                  <FiChevronDown className="w-3.5 h-3.5 rotate-180 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Tiptap;
