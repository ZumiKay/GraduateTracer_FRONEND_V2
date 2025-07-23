import { useSelector } from "react-redux";
import {
  CheckboxQuestionType,
  ConditionalType,
  ContentType,
  QuestionType,
} from "../../types/Form.types";
import { RootState } from "../../redux/store";
import { ErrorToast } from "../Modal/AlertModal";
import { CustomCheckBox, CustomRadio, RenderDropDownMenu } from "./Input";
import { Button, Input } from "@heroui/react";

import { DeleteIcon } from "../svg/GeneralIcon";

interface ChoiceQuestionProps {
  condition?: ConditionalType;
  type: QuestionType.MultipleChoice | QuestionType.CheckBox;
  questionstate: ContentType;
  setquestionsate: (val: Partial<ContentType>) => void;
  onAddCondition?: (answeridx: number) => void;
  removeCondition?: (answeridx: number, ty: "delete" | "unlink") => void;
  isLinked?: (ansidx: number) => boolean;
  handleScrollTo?: (key: string) => void;
}

export const ChoiceQuestionEdit = ({
  type,
  questionstate,
  setquestionsate,
  onAddCondition,
  removeCondition,
  handleScrollTo,
  isLinked,
}: ChoiceQuestionProps) => {
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );

  const isMultipleChoice = type === QuestionType.MultipleChoice;
  const optionKey = isMultipleChoice ? "multiple" : "checkbox";
  const options =
    (questionstate[optionKey] as Array<CheckboxQuestionType>) || [];

  const handleAddOption = () => {
    setquestionsate({
      [optionKey]: [
        ...options,
        {
          idx: options.length,
          content: "",
        },
      ],
    });
  };

  const handleDeleteOption = (idx: number) => {
    setquestionsate({
      [optionKey]: options.filter((_, oIdx) => oIdx !== idx),
    });
    removeCondition?.(idx, "delete");
  };

  const handleChoiceQuestionChange = (value: string, idx: number) => {
    const updatedOptions = options.map((item) =>
      item.idx === idx ? { ...item, content: value } : item
    );

    setquestionsate({ [optionKey]: updatedOptions });
  };

  const handleScrolllToQuestion = (ansidx: number) => {
    if (!handleScrollTo) return;

    const question = allquestion.find((q) => q._id === questionstate._id);
    const linkedContentId = question?.conditional?.find(
      (c) => c.key === ansidx
    );

    if (!linkedContentId) {
      ErrorToast({ title: "Failed", content: "Can't Find Question" });
      return;
    }

    const linkedQuestion = allquestion.findIndex((q, idx) =>
      q._id
        ? q._id === linkedContentId.contentId
        : linkedContentId.contentIdx === idx
    );

    if (linkedQuestion !== -1) {
      handleScrollTo(
        `${allquestion[linkedQuestion].type}${
          allquestion[linkedQuestion]._id ?? linkedQuestion
        }`
      );
    } else {
      ErrorToast({ title: "Failed", content: "Can't Find Question" });
    }
  };

  const renderOption = (option: CheckboxQuestionType, idx: number) => {
    const commonProps = {
      key: `Question${allquestion.indexOf(questionstate)}${optionKey}${idx}`,
      idx,
      isLink: isLinked?.(idx),
      value: option.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        handleChoiceQuestionChange(e.target.value, idx),
      onDelete: () => handleDeleteOption(idx),
      addConditionQuestion: () => onAddCondition?.(idx),
      removeConditionQuestion: () => removeCondition?.(idx, "unlink"),
      handleScrollTo: () => handleScrolllToQuestion(idx),
    };

    return isMultipleChoice ? (
      <CustomRadio {...commonProps} key={commonProps.key} />
    ) : (
      <CustomCheckBox {...commonProps} key={commonProps.key} />
    );
  };

  return (
    <div className="choice_container w-full h-fit p-3 flex flex-col gap-y-5">
      {options.map((option, idx) => renderOption(option, idx))}
      <Button onPress={handleAddOption} color="primary" className="font-bold">
        Add Options
      </Button>
    </div>
  );
};

export const SelectionQuestionEdit = ({
  state,
  setstate,
  onAddCondition,
  removeCondition,
  isLinked,
  handleScrollTo,
}: {
  state: ContentType;
  setstate: (newVal: Partial<ContentType>) => void;
  onAddCondition?: (answeridx: number) => void;
  removeCondition?: (answeridx: number, ty: "delete" | "unlink") => void;
  isLinked?: (ansidx: number) => boolean;
  handleScrollTo?: (key: string) => void;
}) => {
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );
  const handleConditionQuestion = (ansidx: number) => {
    //Refracter below code

    if (isLinked && isLinked(ansidx)) {
      if (removeCondition) removeCondition(ansidx, "unlink");
    } else {
      if (onAddCondition) onAddCondition(ansidx);
    }
  };
  const handleAddOption = () => {
    setstate({ selection: [...(state.selection ?? []), ""] });
  };

  const handleDeleteOption = (didx: number) => {
    //delete Selection Option
    setstate({ selection: state.selection?.filter((_, idx) => idx !== didx) });

    //remove condition from question
    removeCondition?.(didx, "delete");
  };

  return (
    <div className="w-full h-fit flex flex-col items-start gap-y-5">
      <ul className="Optionlist w-full list-none text-lg flex flex-col gap-y-3">
        {state.selection?.map((option, idx) => (
          <li
            key={idx}
            className="w-full h-fit inline-flex gap-x-3 items-center"
          >
            <span className="w-[10px] h-[10px] bg-black rounded-full"></span>
            <Input
              type="text"
              variant="bordered"
              placeholder="option"
              value={option}
              endContent={
                <DeleteIcon
                  onClick={() => {
                    handleDeleteOption(idx);
                  }}
                  className="cursor-pointer"
                  width={"20px"}
                  height={"20px"}
                />
              }
              onChange={({ target }) => {
                setstate({
                  selection: state.selection?.map((item, i) => {
                    if (i === idx) {
                      return (item = target.value);
                    }
                    return item;
                  }),
                });
              }}
            />
            <RenderDropDownMenu
              handleConditionQuestion={() => handleConditionQuestion(idx)}
              isLink={!!isLinked?.(idx)}
              handleScrollTo={() =>
                handleScrollTo &&
                handleScrollTo(
                  `${QuestionType.Selection}${allquestion.indexOf(state)}`
                )
              }
            />
          </li>
        ))}
      </ul>
      <Button
        onPress={() => handleAddOption()}
        color="primary"
        className="font-bold"
      >
        Add Option
      </Button>
    </div>
  );
};
