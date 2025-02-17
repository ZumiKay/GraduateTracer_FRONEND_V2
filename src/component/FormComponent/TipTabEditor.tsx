// src/Tiptap.tsx
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import { ListIcon } from "../svg/GeneralIcon";
import Selection from "./Selection";
import { SelectionType } from "../../types/Global.types";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Code from "@tiptap/extension-code";
import { LinkIcon } from "../svg/InputIcon";
import Link from "@tiptap/extension-link";
import { useState } from "react";
import { AddLinkModal } from "../Modal/Modal";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import ListKeymap from "@tiptap/extension-list-keymap";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import "../FormComponent/input.css";

// define your extension array
const extensions = [
  Placeholder.configure({ placeholder: "Question" }),
  Paragraph,
  Document,
  Text,
  Bold, // Bold formatting
  Italic, // Italic formatting
  Code,
  OrderedList,
  BulletList,
  Heading.configure({ levels: [1, 2, 3] }),
  ListItem,
  ListKeymap,
  TextAlign,
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
          typeof p === "string" ? p : p.scheme
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
  { label: "H1", value: "1" },
  { label: "H2", value: "2" },
  { label: "H3", value: "3" },
];

interface TipTapProps {
  value?: JSONContent;
  onChange?: (val: JSONContent) => void;
  qidx?: number;
}

const Tiptap = ({ value, onChange }: TipTapProps) => {
  const editor = useEditor({
    extensions,
    content: value,

    editorProps: {
      attributes: {
        class:
          "w-full min-h-[40px] text-left h-fit outline-none border-b-2 border-gray-300 bg-gray-50",
      },
    },

    onUpdate: () => {
      if (!editor) return;

      const jsonValue = { ...editor.getJSON() };

      if (onChange) onChange(jsonValue);
    },
  });

  const [addlink, setaddlink] = useState(false);

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

  const toggleHeader = (val: number) => {
    editor
      ?.chain()
      .focus()
      .toggleHeading({
        level: (val === 0 ? Number(activeHeading()) : val) as never,
      })
      .run();
  };

  const activeHeading = (): string => {
    let value = "";

    if (editor?.isActive("heading", { level: 1 })) {
      value = "1";
    } else if (editor?.isActive("heading", { level: 2 })) {
      value = "2";
    } else if (editor?.isActive("heading", { level: 3 })) {
      value = "3";
    }

    return value;
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
      <div className="w-full h-fit flex flex-col gap-y-5">
        <EditorContent editor={editor} />

        <div className="w-full h-[30px] flex flex-row gap-x-3 items-center cursor-default">
          <Selection
            className="w-[150px]"
            items={HeaderOptions}
            selectedKeys={[activeHeading()]}
            onChange={(val) => toggleHeader(Number(val.target.value))}
            placeholder="Heading"
          />
          <span
            onClick={() => applyStyle("bold")}
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
        </div>
      </div>
    </>
  );
};

export default Tiptap;
