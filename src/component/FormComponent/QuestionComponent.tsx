import { ChangeEvent, useEffect, useState } from "react";
import {
  CheckboxQuestionType,
  ConditionalType,
  ContentType,
  QuestionType,
  RangeType,
} from "../../types/Form.types";
import { SelectionType } from "../../types/Global.types";
import { CustomCheckBox, CustomRadio, TextEditor } from "./Input";
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
import { setallquestion } from "../../redux/formstore";
import { RootState } from "../../redux/store";

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
  idx: number;
  color: string;
  value: ContentType;
  isLinked: (ansidx: number) => boolean;
  onDelete: () => void;
  onAddCondition?: (answeridx: number) => void;
  removeCondition?: (answeridx: number) => void;
  onDuplication: () => void;
  scrollToCondition?: (key: string) => void;
}

const QuestionComponent = ({
  idx,
  value,
  color,
  onDelete,
  onAddCondition,
  isLinked,
  removeCondition,
  scrollToCondition,
  onDuplication,
}: QuestionComponentProps) => {
  const [questionstate, setquestionstate] = useState<ContentType>(value);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setallquestion((prev) =>
        prev.map((item, qidx) =>
          qidx === idx ? { ...item, questionstate } : item
        )
      )
    );
  }, [questionstate]);

  const renderContentBaseOnQuestionType = () => {
    switch (questionstate.type) {
      case QuestionType.MultipleChoice: {
        return (
          <ChoiceQuestionEdit
            questionstate={questionstate}
            isLinked={isLinked}
            setquestionsate={setquestionstate}
            type={QuestionType.MultipleChoice}
            onAddCondition={(answeridx) =>
              onAddCondition && onAddCondition(answeridx)
            }
            removeCondition={(answeridx) =>
              removeCondition && removeCondition(answeridx)
            }
            handleScrollTo={scrollToCondition}
          />
        );
      }
      case QuestionType.CheckBox: {
        return (
          <ChoiceQuestionEdit
            questionstate={questionstate}
            setquestionsate={setquestionstate}
            type={QuestionType.CheckBox}
          />
        );
      }
      case QuestionType.RangeDate: {
        return (
          <RangeQuestionEdit
            questionstate={questionstate}
            setquestionsate={setquestionstate}
            type={QuestionType.RangeDate}
          />
        );
      }
      case QuestionType.RangeNumber: {
        return (
          <RangeQuestionEdit
            questionstate={questionstate}
            setquestionsate={setquestionstate}
            type={QuestionType.RangeNumber}
          />
        );
      }
      case QuestionType.Selection: {
        return (
          <SelectionQuestionEdit
            state={questionstate}
            setstate={setquestionstate}
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
      className="w-full h-fit rounded-md flex flex-col items-center gap-y-5 py-5"
    >
      <div className="text_editor w-[97%] bg-white p-3 rounded-b-md flex flex-row items-start justify-start gap-x-3">
        <TextEditor
          value={questionstate.title}
          setvalue={(val) =>
            setquestionstate((prev) => ({ ...prev, title: val }))
          }
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
          defaultSelectedKeys={[questionstate.type]}
          onChange={(e) =>
            setquestionstate((prev) => ({
              ...prev,
              type: e.target.value as QuestionType,
            }))
          }
        />
      </div>
      {questionstate.type !== QuestionType.Text && (
        <div className="content_container w-[97%] h-fit bg-white rounded-lg min-h-[50px] p-2">
          {renderContentBaseOnQuestionType()}
        </div>
      )}
      <div className="detail_section w-fit h-[40px] flex flex-row self-end gap-x-3">
        <div className="questionidx bg-white w-fit h-full p-2 rounded-md">
          {value.parent_question !== undefined &&
          value.parentanswer_idx !== undefined
            ? `Conditional For Q${
                typeof value.parent_question === "number"
                  ? value.parent_question + 1
                  : value.parent_question
              } (A${value.parentanswer_idx + 1})`
            : `Question ${idx + 1}`}
        </div>
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
              setquestionstate((prev) => ({ ...prev, require: val }));
            }}
            isSelected={questionstate.require}
            color="danger"
            size="sm"
          >
            Required
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default QuestionComponent;

interface ChoiceQuestionProps {
  condition?: ConditionalType;
  type: QuestionType.MultipleChoice | QuestionType.CheckBox;
  questionstate: ContentType;
  setquestionsate: React.Dispatch<React.SetStateAction<ContentType>>;
  onAddCondition?: (answeridx: number) => void;
  removeCondition?: (answeridx: number) => void;
  isLinked?: (ansidx: number) => boolean;
  handleScrollTo?: (key: string) => void;
}

export const ChoiceQuestionEdit = ({
  type,
  questionstate,
  setquestionsate,
  onAddCondition,
  condition,
  removeCondition,
  handleScrollTo,
  isLinked,
}: ChoiceQuestionProps) => {
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );
  const handleAddOption = () => {
    const type = questionstate.type;
    setquestionsate((prev) => ({
      ...prev,
      [type]: [
        ...(prev[type as never] ?? []),
        {
          idx: prev[type as never] ? (prev[type as never] as []).length : 0,
          content: "",
        },
      ],
    }));
  };
  const handleDeleteOption = (idx: number) => {
    setquestionsate((prev: ContentType) => {
      const updatedOptions = (
        prev[questionstate.type as keyof ContentType] as CheckboxQuestionType[]
      ).filter((item) => item.idx !== idx);

      //update condition of question
      removeCondition?.(idx);

      return { ...prev, multiple: updatedOptions };
    });
  };

  const handleChoiceQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    setquestionsate((prev) => {
      const newOption = (
        prev[questionstate.type as never] as CheckboxQuestionType[]
      ).map((item) => {
        if (item.idx === idx) {
          return { ...item, content: e.target.value };
        }
        return item;
      });
      return { ...prev, multiple: newOption };
    });
  };
  return (
    <div className="choice_container w-full h-fit p-3 flex flex-col gap-y-5">
      {type === QuestionType.MultipleChoice
        ? questionstate.multiple?.map((option, idx) => (
            <CustomRadio
              condition={condition}
              idx={idx}
              isLink={isLinked?.(idx)}
              value={option.content}
              onChange={(e) => {
                handleChoiceQuestionChange(e, idx);
              }}
              key={idx}
              onDelete={() => handleDeleteOption(idx)}
              addConditionQuestion={() => onAddCondition?.(idx)}
              removeConditionQuestion={() => removeCondition?.(idx)}
              handleScrollTo={() => {
                if (handleScrollTo) {
                  //scroll to
                  const question = allquestion.find(
                    (i) => i.parentanswer_idx === idx
                  );
                  if (question) {
                    handleScrollTo(
                      `${question.type}${allquestion.indexOf(question)}`
                    );
                  } else alert("No Question Found");
                }
              }}
            />
          ))
        : questionstate.checkbox?.map((option, idx) => (
            <CustomCheckBox
              key={idx}
              value={option.content}
              onChange={(e) => {
                handleChoiceQuestionChange(e, idx);
              }}
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
  setquestionsate: React.Dispatch<React.SetStateAction<ContentType>>;
}) => {
  const handleDateRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setquestionsate((prev) => ({
      ...prev,
      numrange: {
        ...prev.numrange,
        [e.target.name]: Number(e.target.value),
      } as RangeType<number>,
    }));
  };
  return (
    <div className="w-full h-fit flex flex-row items-center gap-x-5">
      {type === QuestionType.RangeDate ? (
        <DateRangePicker
          onChange={(val) => {
            if (!val) return;
            setquestionsate((prev) => ({
              ...prev,
              range: val,
            }));
          }}
          size="lg"
          value={questionstate?.range}
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
}: {
  state: ContentType;
  setstate: React.Dispatch<React.SetStateAction<ContentType>>;
}) => {
  const handleAddOption = () => {
    setstate((prev) => ({
      ...prev,
      selection: [...(prev.selection ?? []), ""],
    }));
  };
  return (
    <div className="w-full h-fit flex flex-col items-start gap-y-5">
      <ul className="Optionlist list-none text-lg flex flex-col gap-y-3">
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
                    setstate((prev) => {
                      const newOptions = prev.selection?.filter(
                        (_, i) => i !== idx
                      );
                      return { ...prev, selection: newOptions };
                    });
                  }}
                  className="cursor-pointer"
                  width={"20px"}
                  height={"20px"}
                />
              }
              onChange={({ target }) => {
                setstate((prev) => {
                  const newOptions = prev.selection?.map((item, i) => {
                    if (i === idx) {
                      return (item = target.value);
                    }
                    return item;
                  });
                  return { ...prev, selection: newOptions };
                });
              }}
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
