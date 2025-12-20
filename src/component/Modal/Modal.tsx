import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
} from "@heroui/react";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { Editor } from "@tiptap/react";

interface ModalWrapperProps {
  isOpen: boolean;
  size: ModalProps["size"];
  onClose: () => void;
  children: React.ReactNode;
  footer?: (onClose: () => void) => React.ReactNode;
  title?: string;
  className?: string;
}
export default function ModalWrapper({
  isOpen,
  size,
  onClose,
  children,
  footer,
  title,
  className,
}: ModalWrapperProps) {
  return (
    <Modal size={size} onClose={onClose} isOpen={isOpen} className={className}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{title ?? "Modal Title"}</ModalHeader>
            <ModalBody>{children}</ModalBody>
            {footer && <ModalFooter>{footer(onClose)}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export const AddLinkModal = ({
  open,
  setopen,
  editorState,
  isLinkInSelection,
}: {
  open: boolean;
  setopen: React.Dispatch<React.SetStateAction<boolean>>;
  editorState: Editor | null;
  isLinkInSelection: boolean;
}) => {
  const selectedText = editorState?.state.doc.textBetween(
    editorState?.state.selection.from,
    editorState?.state.selection.to,
    " "
  );
  const [state, setstate] = useState({
    texttoshow: selectedText,
    link: editorState?.getAttributes("link").href,
  });

  const handleAddOrEditLink = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editorState) return;
    let url = state.link.trim() as string;

    // Cancelled if no URL
    if (!url) {
      return;
    }

    // Remove link if the URL is empty
    if (url === "") {
      editorState
        .chain()
        .focus()
        .extendMarkRange("link")
        .unsetMark("link")
        .run();
      return;
    }

    // Ensure text is selected

    const { from, to } = editorState.state.selection;
    if (from === to) {
      alert("No text selected to add a link.");
      return;
    }

    try {
      // Apply link mark to selected text

      if (!url.includes("https://")) {
        url = `https://${url}`;
      }

      editorState
        .chain()
        .focus()
        .extendMarkRange("link")
        .setMark("link", { href: url, target: "_blank" }) // Add target=_blank for external links
        .run();

      // If `texttoshow` exists, replace selected text
      if (state.texttoshow) {
        editorState?.commands.insertContentAt({ from, to }, state.texttoshow);
      }

      setopen(false);
    } catch (e) {
      const error = e as { message?: string };
      alert(error?.message ?? "An error occurred while adding the link.");
    }
  };

  const handleRemoveLink = () => {
    editorState?.chain().focus().unsetMark("link").run();
    setopen(false);
    setstate({ link: "", texttoshow: "" });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setstate((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <ModalWrapper onClose={() => setopen(false)} isOpen={open} size="md">
      <Form
        onSubmit={handleAddOrEditLink}
        className="AddLinkModal w-full h-full bg-white dark:bg-gray-800 flex flex-col gap-y-5 items-center rounded-md p-2"
      >
        <Input
          name="texttoshow"
          size="sm"
          variant="bordered"
          onChange={handleChange}
          value={state.texttoshow}
          placeholder="Text to show"
        />
        <Input
          name="link"
          size="sm"
          variant="bordered"
          onChange={handleChange}
          value={state.link}
          placeholder="Enter Link"
        />
        <div className="btn_container w-full h-[30px] flex flex-row gap-x-3">
          <Button type="submit" color="primary" className="max-w-sm font-bold">
            {isLinkInSelection ? "Edit Link" : "Add Link"}
          </Button>
          {isLinkInSelection && (
            <Button
              type="button"
              color="secondary"
              className="max-w-sm font-bold"
              onPress={handleRemoveLink}
            >
              Remove Link
            </Button>
          )}
        </div>
      </Form>
    </ModalWrapper>
  );
};
