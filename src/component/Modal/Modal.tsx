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
} from "@nextui-org/react";
import { EditorState, Modifier, RichUtils } from "draft-js";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";

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
  seteditorState,
  isLinkInSelection,
}: {
  open: boolean;
  setopen: React.Dispatch<React.SetStateAction<boolean>>;
  editorState: EditorState;
  seteditorState: React.Dispatch<React.SetStateAction<EditorState>>;
  isLinkInSelection: boolean;
}) => {
  const [state, setstate] = useState({
    texttoshow: "",
    link: "",
  });

  useEffect(() => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const startKey = selection.getStartKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();

    const block = contentState.getBlockForKey(startKey);
    const entityKey = block.getEntityAt(startOffset);

    if (entityKey) {
      const entity = contentState.getEntity(entityKey);
      const { url } = entity.getData();

      setstate({
        texttoshow: block.getText().slice(startOffset, endOffset),
        link: url || "",
      });
    } else {
      setstate({
        texttoshow: block.getText().slice(startOffset, endOffset),
        link: "",
      });
    }
  }, [editorState]);

  const handleAddOrEditLink = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();

    if (!selection.isCollapsed()) {
      if (!/^https?:\/\//.test(state.link)) {
        alert("Please enter a valid URL (e.g., http:// or https://)");
        return;
      }

      // Create or replace LINK entity
      const contentStateWithEntity = contentState.createEntity(
        "LINK",
        "MUTABLE",
        {
          url: state.link,
        }
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

      let newContentState = Modifier.applyEntity(
        contentStateWithEntity,
        selection,
        entityKey
      );

      if (state.texttoshow) {
        // Replace the selected text with `texttoshow` if it's different
        newContentState = Modifier.replaceText(
          newContentState,
          selection,
          state.texttoshow,
          undefined,
          entityKey
        );
      }

      // Update the editor state
      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "apply-entity"
      );
      seteditorState(newEditorState);
      setopen(false);
    } else {
      alert("Please select text to add or edit a link.");
    }
  };

  const handleRemoveLink = () => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const newEditorState = RichUtils.toggleLink(editorState, selection, null);
      seteditorState(newEditorState);
      setopen(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setstate((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <ModalWrapper onClose={() => setopen(false)} isOpen={open} size="md">
      <Form
        onSubmit={handleAddOrEditLink}
        className="AddLinkModal w-full h-full bg-white flex flex-col gap-y-5 items-center rounded-md p-2"
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
