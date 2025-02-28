import { Button, Checkbox, Form, Input } from "@heroui/react";
import ModalWrapper from "./Modal";
import Selection from "../FormComponent/Selection";
import { SelectionType } from "../../types/Global.types";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  FormDataType,
  FormTypeEnum,
  returnscore,
} from "../../types/Form.types";
import ApiRequest from "../../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "./AlertModal";
import { useNavigate } from "react-router";

interface CreateFormProps {
  open: boolean;
  setopen: () => void;
  id?: string;
}

const FormTypeOptions: Array<SelectionType<string>> = [
  { label: "Quiz", value: FormTypeEnum.Quiz },
  { label: "Normal", value: FormTypeEnum.Normal },
];

const ReturnScoreOptions: Array<SelectionType<string>> = [
  { label: "Partial", value: returnscore.partial },
  { label: "Manual", value: returnscore.manual },
];

export default function CreateForm({
  open,
  setopen: setclose,
  id,
}: CreateFormProps) {
  const [loading, setloading] = useState(false);
  const [formtype, setformtype] = useState<FormTypeEnum>(FormTypeEnum.Normal);

  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  //Fetch Form Data For Edit

  useEffect(() => {
    if (id) {
      const AsyncGetFormData = async () => {
        try {
          setloading(true);
          const response = await ApiRequest({
            url: `/filterdform?ty=detail&q=${id}`,
            method: "GET",
            cookie: true,
            refreshtoken: true,
          });

          if (!response.success) {
            ErrorToast({
              toastid: "editform",
              title: "Error",
              content: response.error || "Failed to fetch form data",
            });
            return;
          }

          const formData = response.data as unknown as FormDataType;
          const formElements = formRef.current?.elements;

          if (!formRef.current || !formElements) {
            console.warn("Form reference not found");
            return;
          }

          for (const [key, value] of Object.entries(formData)) {
            const element = formElements.namedItem(key);
            if (!element) continue;

            if (
              element instanceof HTMLInputElement &&
              element.type === "checkbox"
            ) {
              element.checked = Boolean(value);
            } else if (
              element instanceof HTMLInputElement ||
              element instanceof HTMLSelectElement ||
              element instanceof HTMLTextAreaElement
            ) {
              element.value = String(value ?? "");
            }
          }
        } catch (error) {
          ErrorToast({
            toastid: "editform",
            title: "Error",
            content:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        } finally {
          setloading(false);
        }
      };
      AsyncGetFormData();
    }
  }, []);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const jsonFormState = Object.fromEntries(formData) as Partial<FormDataType>;

    // Handle checkboxes to capture their checked state
    const formElements = e.currentTarget.elements;

    const setting: { [key: string]: boolean } = {};
    for (const element of formElements) {
      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        const name = element.name;
        setting[name] = element.checked;
      }
    }

    //Async Create Form
    setloading(true);
    const request = await ApiRequest({
      method: "POST",
      url: "/createform",
      data: { ...jsonFormState, email: undefined, setting },
      cookie: true,
      refreshtoken: true,
    });
    setloading(false);

    if (!request.success) {
      ErrorToast({
        toastid: "createform",
        title: "Error",
        content: request.error ?? "Error Occured",
      });
      return;
    }

    SuccessToast({
      toastid: "createform",
      title: "Success",
      content: "Form Created",
    });

    formRef.current?.reset();
    setclose();
    navigate("/form/" + jsonFormState.title, { replace: true });
  };

  return (
    <ModalWrapper
      size="2xl"
      isOpen={open}
      onClose={() => setclose()}
      title="Create Form"
    >
      <Form
        ref={formRef}
        onSubmit={handleCreate}
        aria-label="Create Form"
        validationBehavior="native"
        className="formcreation w-full h-full bg-white flex flex-col gap-y-5 items-center"
      >
        <Input
          type="text"
          name="title"
          size="sm"
          label="Title"
          labelPlacement="outside"
          placeholder="Form title"
          isRequired
        />
        <Selection
          items={FormTypeOptions}
          label="Type"
          size="sm"
          labelPlacement="outside"
          selectedKeys={[formtype]}
          onChange={(val) => setformtype(val.target.value as never)}
          name="type"
          placeholder="Select Form Type"
          errorMessage="Please Select Form Type"
          isRequired
        />

        <Selection
          items={ReturnScoreOptions}
          label="Return Score"
          isDisabled={formtype === FormTypeEnum.Normal}
          size="sm"
          labelPlacement="outside"
          name="returnscore"
          placeholder="Select Return Type"
        />

        <div className="w-full h-fit flex flex-row flex-wrap gap-x-3">
          <Checkbox name="email" color="secondary">
            Require Email
          </Checkbox>
          <Checkbox name="submitonce" color="secondary">
            Response Once
          </Checkbox>
        </div>

        <Button
          isLoading={loading}
          type="submit"
          className="bg-primary text-white max-w-sm"
        >
          Create
        </Button>
      </Form>
    </ModalWrapper>
  );
}
