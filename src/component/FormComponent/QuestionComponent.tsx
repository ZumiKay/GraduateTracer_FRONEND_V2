import { ChangeEvent } from "react";
import {
  CheckboxQuestionType,
  ConditionalType,
  ContentType,
  QuestionType,
  RangeType,
} from "../../types/Form.types";
import { SelectionType } from "../../types/Global.types";
import { CustomCheckBox, CustomRadio, RenderDropDownMenu } from "./Input";
import Selection from "./Selection";
import {
  Button,
  DateRangePicker,
  Input,
  Switch,
  Tooltip,
} from "@nextui-org/react";
import { CopyIcon, DeleteIcon, TrashIcon } from "../svg/GeneralIcon";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setallquestion, setdisbounceQuestion } from "../../redux/formstore";
import { RootState } from "../../redux/store";
import Tiptap from "./TipTabEditor";
import { ErrorToast } from "../Modal/AlertModal";
import { parseDate } from "@internationalized/date";
import { FormatDate } from "../../helperFunc";

const QuestionTypeOptions: Array<SelectionType<QuestionType>> = [
  { label: "Multiple Choice", value: QuestionType.MultipleChoice },
  { label: "CheckBox", value: QuestionType.CheckBox },
  { label: "Number", value: QuestionType.Number },
  { label: "Date", value: QuestionType.Date },
  { label: "RangeNumber", value: QuestionType.RangeNumber },
  { label: "RangeDate", value: QuestionType.RangeDate },
  { label: "Selection", value: QuestionType.Selection },
  { label: "Text", value: QuestionType.Text },
];

interface QuestionComponentProps {
  id?: string;
  idx: number;
  color: string;
  value: ContentType;
  isLinked: (ansidx: number) => boolean;
  onDelete: () => void;
  onAddCondition?: (answeridx: number) => void;
  removeCondition?: (answeridx: number, ty: "delete" | "unlink") => void;
  onDuplication: () => void;
  scrollToCondition?: (key: string) => void;
  isConditioned: () => { key: string; qIdx: number; ansIdx: number };
}

const QuestionComponent = ({
  id,
  idx,
  value,
  color,
  onDelete,
  onAddCondition,
  isLinked,
  removeCondition,
  scrollToCondition,
  onDuplication,
  isConditioned,
}: QuestionComponentProps) => {
  const dispatch = useDispatch();
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );
  const { setting } = useSelector((root: RootState) => root.allform.formstate);

  const onUpdateState = async (newVal: Partial<ContentType>) => {
    //Save and Update Question State
    const updatedQuestions = allquestion.map((question, qidx) => {
      if ((question._id && question._id === id) || qidx === idx) {
        const updatedQuestion = { ...question, ...newVal };

        if (setting?.autosave) {
          dispatch(setdisbounceQuestion(updatedQuestion)); // Avoid multiple dispatches
        }

        return updatedQuestion;
      }

      return question;
    });

    dispatch(setallquestion(updatedQuestions as Array<ContentType>));
  };

  const renderContentBaseOnQuestionType = () => {
    switch (value.type) {
      case QuestionType.MultipleChoice:
      case QuestionType.CheckBox: {
        return (
          <ChoiceQuestionEdit
            type={value.type as never}
            questionstate={value}
            isLinked={isLinked}
            setquestionsate={(val) => onUpdateState({ ...val })}
            onAddCondition={(answeridx) =>
              onAddCondition && onAddCondition(answeridx)
            }
            removeCondition={(answeridx, ty) =>
              removeCondition && removeCondition(answeridx, ty)
            }
            handleScrollTo={scrollToCondition}
          />
        );
      }

      case QuestionType.RangeDate: {
        return (
          <RangeQuestionEdit
            questionstate={value}
            setquestionsate={(val) => onUpdateState({ ...val })}
            type={QuestionType.RangeDate}
          />
        );
      }
      case QuestionType.RangeNumber: {
        return (
          <RangeQuestionEdit
            questionstate={value}
            setquestionsate={(val) => onUpdateState({ ...val })}
            type={QuestionType.RangeNumber}
          />
        );
      }
      case QuestionType.Selection: {
        return (
          <SelectionQuestionEdit
            state={value}
            isLinked={isLinked}
            onAddCondition={(ansidx) =>
              onAddCondition && onAddCondition(ansidx)
            }
            removeCondition={(ansidx) =>
              removeCondition && removeCondition(ansidx, "unlink")
            }
            handleScrollTo={scrollToCondition}
            setstate={(val) => onUpdateState({ ...val })}
          />
        );
      }

      default:
        break;
    }
  };
  return (
    <div
      style={{ backgroundColor: color }}
      className="w-full h-fit flex flex-col items-center gap-y-5 py-5 relative"
    >
      <div className="question_count absolute -top-10 right-0 font-bold bg-secondary text-white p-2">
        {`Question ${idx + 1}`}
      </div>
      <div className="text_editor w-[97%] bg-white p-3 rounded-b-md flex flex-row items-start justify-start gap-x-3">
        <Tiptap
          qidx={idx}
          value={value.title as never}
          onChange={(val) => onUpdateState({ title: val })}
        />
        <Selection
          className="max-w-sm rounded-sm"
          variant="underlined"
          size="lg"
          name="type"
          radius="sm"
          color="warning"
          placeholder="Question Type"
          items={QuestionTypeOptions}
          defaultSelectedKeys={[value.type]}
          onChange={(e) => {
            onUpdateState({ type: e.target.value as QuestionType });
          }}
        />
      </div>
      {value.type !== QuestionType.Text && (
        <div className="content_container w-[97%] h-fit bg-white rounded-lg min-h-[50px] p-2">
          {renderContentBaseOnQuestionType()}
        </div>
      )}
      <div className="detail_section w-fit h-[40px] flex flex-row self-end gap-x-3">
        <div className="danger_section w-fit h-full self-end p-2 mr-2 bg-white rounded-md flex flex-row items-center gap-x-5">
          <Tooltip placement="bottom" content="Delete Question">
            <div
              onClick={() => {
                onDelete();
              }}
              className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md"
            >
              <TrashIcon width={"20px"} height={"20px"} />
            </div>
          </Tooltip>

          <Tooltip content="Duplicate Question" placement="bottom">
            <div
              onClick={() => onDuplication()}
              className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md"
            >
              <CopyIcon width={"20px"} height={"20px"} />
            </div>
          </Tooltip>
          <Switch
            onValueChange={(val) => {
              onUpdateState({ require: val });
            }}
            isSelected={value.require}
            color="danger"
            size="sm"
          >
            Required
          </Switch>
        </div>
      </div>
      {isConditioned().qIdx !== -1 && (
        <div
          onClick={() => {
            scrollToCondition?.(isConditioned().key);
          }}
          className="condition_indicator w-fit p-2  bg-secondary rounded-b-md text-white font-medium cursor-pointer hover:bg-gray-200 absolute top-[100%]"
        >
          {`Condition for question ${isConditioned().qIdx + 1} and option ${
            isConditioned().ansIdx + 1
          }`}
        </div>
      )}
    </div>
  );
};

export default QuestionComponent;

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
  const handleAddOption = () => {
    const type = questionstate.type;
    const question = questionstate[
      type as never
    ] as Array<CheckboxQuestionType>;

    setquestionsate({
      [type]: [
        ...(question ?? []),
        {
          idx: question?.length ?? 0,
          content: "",
        },
      ],
    });
  };
  const handleDeleteOption = (idx: number) => {
    const updatedOptions = questionstate[
      questionstate.type as keyof ContentType
    ] as Array<CheckboxQuestionType>;

    //Update Question State
    setquestionsate({
      [questionstate.type]: updatedOptions.filter((_, oIdx) => oIdx !== idx),
    });
    removeCondition?.(idx, "delete");
  };

  const handleChoiceQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const updatedOptions = (
      questionstate[
        questionstate.type as keyof ContentType
      ] as Array<CheckboxQuestionType>
    ).map((item) => {
      if (item.idx === idx) {
        return { ...item, content: e.target.value };
      }
      return item;
    });

    setquestionsate({ [questionstate.type]: updatedOptions });
  };

  const handleScrolllToQuestion = (ansidx: number) => {
    if (handleScrollTo) {
      //scroll to
      const question = allquestion.find((q) => q._id === questionstate._id);
      const linkedContentId = question?.conditional?.find(
        (c) => c.key === ansidx
      );

      if (linkedContentId) {
        const linkedQuestion = allquestion.find(
          (q) => q._id === linkedContentId.contentId
        );
        if (linkedQuestion)
          handleScrollTo(
            `${linkedQuestion?.type}${
              linkedQuestion?._id ?? allquestion.indexOf(linkedQuestion)
            }`
          );
      } else {
        ErrorToast({ title: "Failed", content: "Can't Find Question" });
      }
    }
  };
  return (
    <div className="choice_container w-full h-fit p-3 flex flex-col gap-y-5">
      {type === QuestionType.MultipleChoice
        ? questionstate.multiple?.map((option, idx) => (
            <CustomRadio
              key={`Question${allquestion.indexOf(questionstate)}radio${idx}`}
              idx={idx}
              isLink={isLinked?.(idx)}
              value={option.content}
              onChange={(e) => {
                handleChoiceQuestionChange(e, idx);
              }}
              onDelete={() => handleDeleteOption(idx)}
              addConditionQuestion={() => onAddCondition?.(idx)}
              removeConditionQuestion={() => removeCondition?.(idx, "unlink")}
              handleScrollTo={() => handleScrolllToQuestion(idx)}
            />
          ))
        : questionstate.checkbox?.map((option, idx) => (
            <CustomCheckBox
              key={`Question${allquestion.indexOf(
                questionstate
              )}checkbox${idx}`}
              idx={idx}
              isLink={isLinked?.(idx)}
              addConditionQuestion={() => onAddCondition?.(idx)}
              removeConditionQuestion={() => removeCondition?.(idx, "unlink")}
              value={option.content}
              onChange={(e) => {
                handleChoiceQuestionChange(e, idx);
              }}
              handleScrollTo={() => handleScrolllToQuestion(idx)}
              onDelete={() => handleDeleteOption(idx)}
            />
          ))}
      <Button
        onPress={() => handleAddOption()}
        color="primary"
        className="font-bold"
      >
        Add Options
      </Button>
    </div>
  );
};

const RangeQuestionEdit = ({
  type,
  questionstate,
  setquestionsate,
}: {
  type: QuestionType.RangeNumber | QuestionType.RangeDate;
  questionstate: ContentType;
  setquestionsate: (newVal: Partial<ContentType>) => void;
}) => {
  const handleDateRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setquestionsate({
      numrange: {
        ...(questionstate.numrange ?? []),
        [e.target.name]: Number(e.target.value),
      } as RangeType<number>,
    });
  };
  return (
    <div className="w-full h-fit flex flex-row items-center gap-x-5">
      {type === QuestionType.RangeDate ? (
        <DateRangePicker
          onChange={(val) => {
            if (!val) return;

            setquestionsate({
              range: {
                start: FormatDate(new Date(val.start)),
                end: FormatDate(new Date(val.end)),
              },
            });
          }}
          size="lg"
          value={
            questionstate.range && {
              start: parseDate(questionstate.range.start) as never,
              end: parseDate(questionstate.range.end) as never,
            }
          }
          startName="start"
          aria-label="Date Range"
          endName="start"
        />
      ) : (
        <>
          <Input
            type="number"
            size="lg"
            placeholder="Start Number"
            value={questionstate.numrange?.start?.toString()}
            onChange={handleDateRangeChange}
            name="start"
          />
          <Input
            type="number"
            size="lg"
            placeholder="End Number"
            value={questionstate.numrange?.end?.toString()}
            onChange={handleDateRangeChange}
            name="end"
          />
        </>
      )}
    </div>
  );
};

const SelectionQuestionEdit = ({
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
    setstate({ selection: state.selection?.filter((_, i) => i !== didx) });

    //Remove Condition from question
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
            <Button
              onPress={() => console.log(allquestion)}
              className="max-w-xs"
              variant="bordered"
            >
              Test State
            </Button>
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
