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
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";

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

      <div ref={containerRef} className="w-full h-fit flex flex-col gap-y-5">
        <EditorContent editor={editor} tabIndex={-1} aria-hidden={false} />
        {!readonly && (
          <div className="w-full h-[30px] flex flex-row gap-x-3 items-center cursor-default">
            <Selection
              className="w-[150px]"
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
            <span
              onClick={() => applyStyle("bold")}
              title="Bold (⌘B / Ctrl+B)"
              className={`font-bold w-[30px] h-full grid place-content-center
        rounded-lg hover:bg-primary active:bg-primary transition-colors ${
          isStyleActive("bold")
            ? "bg-primary text-white"
            : "bg-lightsucess text-black"
        }`}
            >
              B
            </span>
            <span
              onClick={() => applyStyle("italic")}
              title="Italic (⌘I / Ctrl+I)"
              className={`font-bold italic w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              isStyleActive("italic")
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
            >
              I
            </span>
            <span
              onClick={() => applyStyle("code")}
              className={`font-bold w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              isStyleActive("code")
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
            >
              {`</>`}
            </span>
            <span
              onClick={() => setaddlink(true)}
              className={`font-bold w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              isLinkSelection()
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
            >
              <LinkIcon
                width={"20px"}
                height={"20px"}
                fill={isLinkSelection() ? "#fff" : "#000000"}
              />
            </span>
            <span
              onClick={() => toggleListOrder()}
              className={`font-bold w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              listactive("bulletList") || listactive("orderedList")
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
            >
              <ListIcon
                fill={
                  listactive("bulletList") || listactive("orderedList")
                    ? "#fff"
                    : "#000000"
                }
                width={"20px"}
                height={"20px"}
              />
            </span>
            <span
              title="Alphabetical list (a, b, c…)"
              onClick={() => toggleAlphaList()}
              className={`font-bold w-[30px] h-full grid place-content-center rounded-lg hover:bg-primary active:bg-primary transition-colors text-sm ${
                isAlphaList()
                  ? "bg-primary text-white"
                  : "bg-lightsucess text-black"
              }`}
            >
              a.
            </span>
            <span
              title="Alphabetical list (A, B, C…)"
              onClick={() => toggleUpperAlphaList()}
              className={`font-bold w-[30px] h-full grid place-content-center rounded-lg hover:bg-primary active:bg-primary transition-colors text-sm ${
                isUpperAlphaList()
                  ? "bg-primary text-white"
                  : "bg-lightsucess text-black"
              }`}
            >
              A.
            </span>
            <span
              title="Insert math block (display)"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({ type: "displayMath", attrs: { latex: "" } })
                  .run()
              }
              className="font-bold w-[30px] h-full grid place-content-center rounded-lg hover:bg-primary active:bg-primary transition-colors bg-lightsucess text-black text-base"
            >
              ∑
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default Tiptap;
