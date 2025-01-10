import { Input, InputProps } from "@nextui-org/react";
import React, { useEffect, useRef, useState } from "react";
import { EyeFilledIcon, EyeSlashFilledIcon, LinkIcon } from "../svg/InputIcon";
import {
  EditorState,
  RichUtils,
  Editor,
  ContentState,
  ContentBlock,
  DraftDecoratorComponentProps,
  CompositeDecorator,
  DraftBlockType,
  convertToRaw,
  convertFromRaw,
  RawDraftContentState,
} from "draft-js";
import "./input.css";
import "draft-js/dist/Draft.css";

import Selection, { DropDownMenu } from "./Selection";
import { SelectionType } from "../../types/Global.types";
import { AddLinkModal } from "../Modal/Modal";
import { DeleteIcon, ListIcon } from "../svg/GeneralIcon";
import { ConditionalType } from "../../types/Form.types";

export const PasswordInput = (props: InputProps) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Input
      endContent={
        <button
          aria-label="toggle password visibility"
          className="focus:outline-none"
          type="button"
          onClick={toggleVisibility}
        >
          {isVisible ? (
            <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
          ) : (
            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
          )}
        </button>
      }
      type={isVisible ? "text" : "password"}
      {...props}
    />
  );
};

const HeaderOptions: Array<SelectionType<string>> = [
  { label: "None", value: "unstyled" },
  { label: "H1", value: "header-one" },
  { label: "H2", value: "header-two" },
  { label: "H3", value: "header-three" },
];

function findLinkEntities(
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
  contentState: ContentState
): void {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "LINK"
    );
  }, callback);
}

const Link: React.FC<DraftDecoratorComponentProps> = (props) => {
  const { url } = props.contentState
    .getEntity(props.entityKey as string)
    .getData() as {
    url: string;
  };

  return (
    <a href={url} style={{ color: "blue", textDecoration: "underline" }}>
      {props.children}
    </a>
  );
};

export const TextEditor = ({
  value,
  setvalue,
}: {
  value?: RawDraftContentState;
  setvalue: (value: RawDraftContentState) => void;
}) => {
  const [editorState, setEditorState] = React.useState(() =>
    EditorState.createEmpty()
  );
  const [addlink, setaddlink] = useState(false);
  const [header, setheader] = React.useState<string>("");
  const [focus, setfocus] = React.useState(false);

  useEffect(() => {
    const customdecorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link,
      },
    ]);
    if (value) {
      const contentState = convertFromRaw(value);
      setEditorState(
        EditorState.createWithContent(contentState, customdecorator)
      );
    } else {
      setEditorState(EditorState.createEmpty(customdecorator));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const getBlockType = () => {
      const currentBlock = editorState
        .getCurrentContent()
        .getBlockForKey(editorState.getSelection().getStartKey())
        .getType();
      return currentBlock;
    };

    const blockType = getBlockType();
    setheader(blockType);
  }, [editorState]);

  const editorref = useRef<HTMLInputElement>(null);

  const isStyleActive = (style: string) => {
    const currentStyle = editorState.getCurrentInlineStyle();
    return currentStyle.has(style);
  };

  const isLinkInSelection = () => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const startKey = selection.getStartKey();
    const startOffset = selection.getStartOffset();
    const block = contentState.getBlockForKey(startKey);
    const entityKey = block.getEntityAt(startOffset);

    if (entityKey) {
      const entity = contentState.getEntity(entityKey);
      if (entity.getType() === "LINK") {
        const { url } = entity.getData() as { url: string };
        return !!url;
      } else return false;
    } // Returns true if LINK is present
    else return false;
  };

  const applyStyle = (style: "bold" | "italic" | "link") => {
    let InlineStyleState;

    if (style === "bold") {
      InlineStyleState = RichUtils.toggleInlineStyle(editorState, "BOLD");
    } else if (style === "italic") {
      InlineStyleState = RichUtils.toggleInlineStyle(editorState, "ITALIC");
    }

    setEditorState(InlineStyleState as never);
  };

  const handleKeyCommand = (command: never) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const ToggleHeader = (value: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, value));
  };
  const ToggleUnOrderList = () => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const blockType = contentState
      .getBlockForKey(selection.getStartKey())
      .getType();

    // Define the sequence of list styles
    const listTypes: DraftBlockType[] = [
      "unstyled",
      "unordered-list-item",
      "ordered-list-item",
    ];

    // Find the current type's index and move to the next one
    const nextTypeIndex = (listTypes.indexOf(blockType) + 1) % listTypes.length;
    const nextType = listTypes[nextTypeIndex];

    // Toggle the block type to the next type
    const newState = RichUtils.toggleBlockType(editorState, nextType);
    setEditorState(newState);
  };

  return (
    <>
      {addlink && (
        <AddLinkModal
          open={addlink}
          setopen={setaddlink}
          editorState={editorState}
          seteditorState={setEditorState}
          isLinkInSelection={isLinkInSelection()}
        />
      )}
      <div className="text_editor w-full h-fit flex flex-col gap-y-5">
        <div
          onClick={() => editorref.current?.focus()}
          className="text-editor-container w-full min-h-[40px] h-fit 
        overflow-y-auto px-2 py-3 flex flex-col gap-y-2

       "
        >
          <Editor
            ref={editorref as never}
            onFocus={() => setfocus(true)}
            onBlur={() => setfocus(false)}
            placeholder="Question"
            textAlignment="left"
            editorState={editorState}
            onChange={(val) => {
              setvalue(convertToRaw(val.getCurrentContent()));
              setEditorState(val);
            }}
            handleKeyCommand={handleKeyCommand}
          />
          <div
            className={`line w-full h-[3px] self-center bg-gray-300 ${
              focus ? "animate-borderExpand" : ""
            }`}
          ></div>
        </div>
        <div className="w-full h-[30px] flex flex-row gap-x-3 items-center cursor-default">
          <Selection
            className="w-[150px]"
            items={HeaderOptions}
            value={header}
            selectedKeys={[header]}
            placeholder="Heading"
            onChange={(val) => {
              const { value } = val.target;
              ToggleHeader(value);
              setheader(value);
            }}
          />

          <span
            onClick={() => applyStyle("bold")}
            className={`font-bold w-[30px] h-full grid place-content-center
        rounded-lg hover:bg-primary active:bg-primary transition-colors ${
          isStyleActive("BOLD")
            ? "bg-primary text-white"
            : "bg-lightsucess text-black"
        }`}
          >
            B
          </span>
          <span
            onClick={() => applyStyle("italic")}
            className={`font-bold w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              isStyleActive("BOLD")
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
          >
            I
          </span>
          <span
            onClick={() => {
              if (editorState.getSelection().isCollapsed()) {
                alert("Please Select Text");
                return;
              } else {
                setaddlink(true);
              }
            }}
            className={`font-bold w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              isLinkInSelection()
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
          >
            <LinkIcon width={"20px"} height={"20px"} />
          </span>
          <span
            className={`font-bold w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              isLinkInSelection()
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
            onClick={() => ToggleUnOrderList()}
          >
            <ListIcon width={"20px"} height={"20px"} />
          </span>
          <span
            className={`font-bold w-[30px] h-full grid place-content-center
            rounded-lg hover:bg-primary active:bg-primary transition-colors ${
              isLinkInSelection()
                ? "bg-primary text-white"
                : "bg-lightsucess text-black"
            }`}
            onClick={() =>
              console.log(convertToRaw(editorState.getCurrentContent()))
            }
          >
            Test
          </span>
        </div>
      </div>
    </>
  );
};

interface CustomChoiceProps {
  idx?: number;
  label?: string;
  condition?: ConditionalType;
  value?: string;
  meta?: React.HTMLAttributes<HTMLInputElement>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete?: () => void;
  onCondition?: (val: ConditionalType) => void;
  addConditionQuestion?: () => void;
  removeConditionQuestion?: () => void;
  isLink?: boolean;
  handleScrollTo?: () => void;
}

export const CustomCheckBox = (props: CustomChoiceProps) => {
  return (
    <div className="inline-flex items-center">
      <label className="flex items-center cursor-pointer relative">
        <input
          type="checkbox"
          checked
          className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-slate-300 checked:bg-blue-400 checked:border-slate-800"
          id="check"
          disabled={!props.label}
          {...(props.label ? { ...props.meta } : {})}
        />
        <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </span>
      </label>
      {props.label ? (
        <label htmlFor="framework">{props.label}</label>
      ) : (
        <Input
          className="ml-5"
          size="lg"
          value={props.value}
          variant="bordered"
          placeholder="Option"
          onChange={props.onChange}
          endContent={
            <DeleteIcon
              onClick={() => props.onDelete && props.onDelete()}
              width={"20px"}
              height={"20px"}
            />
          }
        />
      )}
    </div>
  );
};

export const CustomRadio = (props: CustomChoiceProps) => {
  const handleConditionQuestion = () => {
    //Refracter below code
    if (props.isLink) {
      if (props.removeConditionQuestion) props.removeConditionQuestion();
    } else {
      if (props.addConditionQuestion) props.addConditionQuestion();
    }
  };

  return (
    <div className="inline-flex items-center">
      <label
        className="relative flex items-center cursor-pointer"
        htmlFor="html"
      >
        <input
          name="framework"
          type="radio"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-slate-400 transition-all"
          id="html"
          disabled={!props.label}
          {...(props.label ? { ...props.meta } : {})}
        />
        <span className="absolute bg-slate-800 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
      </label>
      {props.label ? (
        <label htmlFor="framework">{props.label}</label>
      ) : (
        <div className="w-full h-fit flex flex-row items-center gap-x-3">
          <Input
            className="ml-5"
            size="lg"
            value={props.label}
            variant="bordered"
            placeholder="Option"
            onChange={props.onChange}
            endContent={
              <DeleteIcon
                width={"20px"}
                height={"20px"}
                onClick={() => props.onDelete && props.onDelete()}
              />
            }
          />
          <DropDownMenu
            isLink={props.isLink}
            item={[
              `${props.isLink ? "Unlink" : "Link"}`,
              props.isLink ? "To Question" : "",
            ].filter((i) => i)}
            onAction={(key) => {
              if (key === "Link" || key === "Unlink") handleConditionQuestion();
              else {
                if (props.handleScrollTo) props.handleScrollTo();
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
