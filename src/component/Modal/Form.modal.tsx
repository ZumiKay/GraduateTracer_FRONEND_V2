import { Button, Form, Input } from "@nextui-org/react";
import ModalWrapper from "./Modal";
import Selection from "../FormComponent/Selection";
import { SelectionType } from "../../types/Global.types";
import { FormEvent } from "react";

interface CreateFormProps {
  open: boolean;
  setopen: () => void;
}

const FormTypeOptions: Array<SelectionType<string>> = [
  { label: "Quiz", value: "quiz" },
  { label: "Normal", value: "normal" },
];

export default function CreateForm({ open, setopen }: CreateFormProps) {
  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  return (
    <ModalWrapper
      size="2xl"
      isOpen={open}
      onClose={setopen}
      title="Create Form"
    >
      <Form
        onSubmit={handleCreate}
        validationBehavior="native"
        className="formcreation w-full h-full bg-white flex flex-col gap-y-5 items-center"
      >
        <Selection
          items={FormTypeOptions}
          label="Type"
          size="sm"
          labelPlacement="outside"
          placeholder="Select Form Type"
          errorMessage="Please Select Form Type"
          isRequired
        />
        <Input
          type="text"
          name="title"
          size="sm"
          label="Title"
          labelPlacement="outside"
          placeholder="Form title"
          isRequired
        />
        <Button type="submit" className="bg-primary text-white max-w-sm">
          Create
        </Button>
      </Form>
    </ModalWrapper>
  );
}
