import { Input, InputProps } from "@nextui-org/react";
import React from "react";
import { EyeFilledIcon, EyeSlashFilledIcon } from "../svg/InputIcon";
import { DropDownMenu } from "./Selection";
import { DeleteIcon } from "../svg/GeneralIcon";
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

interface CustomChoiceProps {
  idx?: number;
  label?: string;
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

type RenderDropDownMenuProps = {
  isLink: boolean;
  handleConditionQuestion: () => void;
  handleScrollTo?: () => void;
};
export const RenderDropDownMenu = ({
  isLink,
  handleConditionQuestion,
  handleScrollTo,
}: RenderDropDownMenuProps) => {
  return (
    <DropDownMenu
      isLink={isLink}
      item={[
        `${isLink ? "Unlink" : "Link"}`,
        isLink ? "To Question" : "",
      ].filter((i) => i)}
      onAction={(key) => {
        if (key === "Link" || key === "Unlink") handleConditionQuestion();
        else {
          if (handleScrollTo) handleScrollTo();
        }
      }}
    />
  );
};

export const CustomCheckBox = (props: CustomChoiceProps) => {
  const handleConditionQuestion = () => {
    //Refracter below code
    if (props.isLink) {
      if (props.removeConditionQuestion) props.removeConditionQuestion();
    } else {
      if (props.addConditionQuestion) props.addConditionQuestion();
    }
  };
  return (
    <div className="inline-flex items-center gap-x-3">
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
            strokeWidth="1"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </span>
      </label>
      {props.label ? (
        <label htmlFor="framework">{props.label}</label>
      ) : (
        <>
          <Input
            className="ml-5"
            size="lg"
            variant="bordered"
            placeholder="Option"
            onChange={props.onChange}
            value={props.value}
            endContent={
              <DeleteIcon
                onClick={() => props.onDelete && props.onDelete()}
                width={"20px"}
                height={"20px"}
              />
            }
          />
          <RenderDropDownMenu
            isLink={!!props.isLink}
            handleScrollTo={props.handleScrollTo}
            handleConditionQuestion={handleConditionQuestion}
          />
        </>
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
          <RenderDropDownMenu
            isLink={!!props.isLink}
            handleConditionQuestion={handleConditionQuestion}
            handleScrollTo={props.handleScrollTo}
          />
        </div>
      )}
    </div>
  );
};
