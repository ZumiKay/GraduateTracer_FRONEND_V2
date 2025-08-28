import { useSelector } from "react-redux";
import {
  ChoiceQuestionType,
  ConditionalType,
  ContentType,
  QuestionType,
} from "../../types/Form.types";
import { RootState } from "../../redux/store";
import { ErrorToast } from "../Modal/AlertModal";
import { CustomCheckBox, CustomRadio, RenderDropDownMenu } from "./Input";
import { Button, Input, NumberInput, RangeValue } from "@heroui/react";

import { DeleteIcon } from "../svg/GeneralIcon";
import { useCallback, useState, useEffect } from "react";

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
  const options = (questionstate[optionKey] as Array<ChoiceQuestionType>) || [];

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

  const renderOption = (option: ChoiceQuestionType, idx: number) => {
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
    if (isLinked && isLinked(ansidx)) {
      if (removeCondition) removeCondition(ansidx, "unlink");
    } else {
      if (onAddCondition) onAddCondition(ansidx);
    }
  };
  const handleAddOption = () => {
    setstate({
      selection: [
        ...(state.selection ?? []),
        { idx: state.selection?.length ?? 0, content: "" },
      ],
    });
  };

  const handleDeleteOption = (didx: number) => {
    setstate({ selection: state.selection?.filter((_, idx) => idx !== didx) });

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
              value={option.content}
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
                      return { idx: i, content: target.value };
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

type RangeNumberInputComponentType = {
  onChange: (name: string, val: number) => void;
  val?: RangeValue<number>;
};
export const RangeNumberInputComponent = ({
  onChange,
  val,
}: RangeNumberInputComponentType) => {
  const [value, setvalue] = useState<RangeValue<number>>(
    val ?? {
      start: 0,
      end: 0,
    }
  );

  useEffect(() => {
    if (val) {
      setvalue(val);
    }
  }, [val]);

  const isEndSmallerThanStart = value.end < value.start;

  const handleChange = useCallback(
    (name: "start" | "end", val: number) => {
      setvalue((prev) => ({ ...prev, [name]: val }));
      onChange(name, val);
    },
    [onChange]
  );

  return (
    <div className="RangeNumber w-full flex flex-col gap-y-2">
      <div className="flex flex-row justify-between gap-x-3">
        <NumberInput
          name="start"
          size="md"
          label="Start"
          min={0}
          value={value?.start}
          onValueChange={(val) => handleChange("start", val)}
        />
        <NumberInput
          name="end"
          size="md"
          min={value.start ?? 0}
          label="End"
          value={value?.end}
          onValueChange={(val) => handleChange("end", val)}
          isInvalid={isEndSmallerThanStart}
          errorMessage={
            isEndSmallerThanStart
              ? "End value must be greater than or equal to start value"
              : ""
          }
        />
      </div>
      {isEndSmallerThanStart && (
        <p className="text-tiny text-danger mt-1">
          Invalid range: End value must be greater than or equal to start value
        </p>
      )}
    </div>
  );
};
