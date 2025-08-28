import { ChangeEvent, useCallback, useMemo, memo } from "react";
import { ContentType, QuestionType } from "../../types/Form.types";
import { SelectionType } from "../../types/Global.types";
import Selection from "./Selection";
import { Switch, Tooltip } from "@heroui/react";
import { CopyIcon, ShowLinkedIcon, TrashIcon } from "../svg/GeneralIcon";
import { useDispatch, useSelector } from "react-redux";
import {
  setallquestion,
  setdisbounceQuestion,
  setshowLinkedQuestion,
} from "../../redux/formstore";
import { RootState } from "../../redux/store";
import Tiptap from "./TipTabEditor";
import { setopenmodal } from "../../redux/openmodal";
import {
  ChoiceQuestionEdit,
  RangeNumberInputComponent,
  SelectionQuestionEdit,
} from "./QuestionComponentAssets";
import { DateRangePickerQuestionType } from "./Solution/Answer_Component";

const QuestionTypeOptions: Array<SelectionType<QuestionType>> = [
  { label: "Multiple Choice", value: QuestionType.MultipleChoice },
  { label: "CheckBox", value: QuestionType.CheckBox },
  { label: "Number", value: QuestionType.Number },
  { label: "Date", value: QuestionType.Date },
  { label: "RangeNumber", value: QuestionType.RangeNumber },
  { label: "RangeDate", value: QuestionType.RangeDate },
  { label: "Selection", value: QuestionType.Selection },
  { label: "Text", value: QuestionType.Text },
  { label: "Short Answer", value: QuestionType.ShortAnswer },
  { label: "Paragraph", value: QuestionType.Paragraph },
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
  onShowLinkedQuestions?: (val: boolean) => void;
}

// Memoized selectors to prevent unnecessary re-renders
const selectAllQuestions = (state: RootState) => state.allform.allquestion;
const selectAutosave = (state: RootState) =>
  state.allform.formstate.setting?.autosave;
const selectShowLinkedQuestions = (state: RootState) =>
  state.allform.showLinkedQuestions;

const QuestionComponent = memo(
  ({
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

    const allquestion = useSelector(selectAllQuestions);
    const autosave = useSelector(selectAutosave);
    const allshowLinkedQuestions = useSelector(selectShowLinkedQuestions);

    const questionId = useMemo(() => value._id ?? idx, [idx, value._id]);

    const conditionInfo = useMemo(() => isConditioned(), [isConditioned]);
    const isNotConditioned = conditionInfo.qIdx === -1;
    const isNotTextType = value.type !== QuestionType.Text;

    const currentShowState = useMemo(() => {
      const linkedQuestion = allshowLinkedQuestions?.find(
        (item) => item.question === questionId
      );
      return linkedQuestion?.show !== undefined ? linkedQuestion.show : true;
    }, [allshowLinkedQuestions, questionId]);

    const onUpdateState = useCallback(
      async (newVal: Partial<ContentType>) => {
        const updatedQuestions = allquestion.map((question, qidx) => {
          if ((question._id && question._id === value._id) || qidx === idx) {
            const updatedQuestion = { ...question, ...newVal };

            if (autosave) {
              dispatch(setdisbounceQuestion(updatedQuestion));
            }

            return updatedQuestion;
          }

          return question;
        });

        dispatch(setallquestion(updatedQuestions as Array<ContentType>));
      },
      [allquestion, dispatch, value._id, idx, autosave]
    );

    const renderContentBaseOnQuestionType = useCallback(() => {
      switch (value.type) {
        case QuestionType.MultipleChoice:
        case QuestionType.CheckBox: {
          return (
            <ChoiceQuestionEdit
              type={value.type as never}
              questionstate={value}
              isLinked={isLinked}
              setquestionsate={onUpdateState}
              onAddCondition={onAddCondition}
              removeCondition={removeCondition}
              handleScrollTo={scrollToCondition}
            />
          );
        }

        case QuestionType.RangeDate: {
          return (
            <DateRangePickerQuestionType
              questionstate={value.rangedate}
              setquestionstate={(name, val) =>
                onUpdateState({
                  rangedate: {
                    ...(value.rangedate ?? {}),
                    [name]: val,
                  } as never,
                })
              }
            />
          );
        }

        case QuestionType.RangeNumber: {
          return (
            <RangeNumberInputComponent
              val={value.rangenumber}
              onChange={(name, val) =>
                onUpdateState({
                  rangenumber: {
                    ...(value.rangenumber ?? {}),
                    [name]: val,
                  } as never,
                })
              }
            />
          );
        }
        case QuestionType.Selection: {
          return (
            <SelectionQuestionEdit
              state={value}
              isLinked={isLinked}
              onAddCondition={onAddCondition}
              removeCondition={removeCondition}
              handleScrollTo={scrollToCondition}
              setstate={onUpdateState}
            />
          );
        }

        default:
          return null;
      }
    }, [
      value,
      isLinked,
      onAddCondition,
      onUpdateState,
      removeCondition,
      scrollToCondition,
    ]);

    const handleChangeQuestionType = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const { value: val } = e.target;
        const ToBeDeleteType = value[value.type] as Record<
          string,
          unknown
        > | null;

        if (ToBeDeleteType) {
          dispatch(
            setopenmodal({
              state: "confirm",
              value: {
                open: true,
                data: {
                  question: "All Options Will Be Delete",
                  onAgree: () => {
                    onUpdateState({
                      type: val as QuestionType,
                      [value.type]: null,
                    });
                  },
                },
              },
            })
          );
        } else {
          onUpdateState({
            type: val as QuestionType,
            [value.type]: undefined,
          });
        }
      },
      [dispatch, onUpdateState, value]
    );

    const handleTitleChange = useCallback(
      (val: string) => onUpdateState({ title: val }),
      [onUpdateState]
    );

    const handleRequireChange = useCallback(
      (val: boolean) => onUpdateState({ require: val }),
      [onUpdateState]
    );

    const handleConditionScroll = useCallback(() => {
      scrollToCondition?.(conditionInfo.key);
    }, [scrollToCondition, conditionInfo.key]);

    const handleShowLinkedQuestions = useCallback(() => {
      const currentState = allshowLinkedQuestions ?? [];
      const existingIndex = currentState.findIndex(
        (item) => item.question === questionId
      );

      const newState = [...currentState];
      // Since we show by default, toggle means: if currently showing (default), hide it
      // If currently hidden (explicitly set to false), show it
      const newShowState = !currentShowState;

      if (existingIndex !== -1) {
        newState[existingIndex] = {
          ...newState[existingIndex],
          show: newShowState,
        };
      } else {
        newState.push({ question: questionId, show: newShowState });
      }

      dispatch(setshowLinkedQuestion(newState as never));
    }, [allshowLinkedQuestions, dispatch, questionId, currentShowState]);
    const childContentIdx = useMemo(
      () => (value.parentcontent?.qIdx ?? 0) + idx,
      [idx, value.parentcontent?.qIdx]
    );

    return (
      <div
        className="w-full h-fit flex flex-col rounded-md bg-white border-[15px] items-center gap-y-5 py-5 relative"
        style={{ borderColor: color }}
      >
        <div
          style={{ backgroundColor: color }}
          className="question_count absolute -top-10 right-[45%] rounded-t-md font-bold text-white p-2 w-[150px] text-center "
        >
          {`Question ${value.parentcontent ? childContentIdx : value.qIdx}`}
        </div>

        <div className="text_editor w-[97%] bg-white p-3 rounded-b-md flex flex-row items-start justify-start gap-x-3">
          <Tiptap
            qidx={idx}
            value={value.title as never}
            onChange={handleTitleChange as never}
          />
          <Selection
            className="max-w-sm rounded-sm"
            variant="underlined"
            size="lg"
            name="type"
            radius="sm"
            color="warning"
            placeholder="Question Type"
            selectedKeys={[value.type]}
            items={QuestionTypeOptions}
            defaultSelectedKeys={[value.type]}
            onChange={handleChangeQuestionType}
          />
        </div>
        {isNotTextType && (
          <div className="content_container w-[97%] h-fit bg-white rounded-lg min-h-[50px] p-2">
            {renderContentBaseOnQuestionType()}
          </div>
        )}
        <div className="detail_section w-fit h-[40px] flex flex-row self-end gap-x-3">
          <div className="danger_section w-fit h-full self-end p-2 mr-2 bg-white rounded-md flex flex-row items-center gap-x-5">
            {value.conditional && value.conditional.length > 0 && (
              <Tooltip placement="bottom" content="Show Linked Question">
                <div
                  onClick={handleShowLinkedQuestions}
                  style={{
                    backgroundColor: currentShowState
                      ? "lightblue"
                      : "transparent",
                  }}
                  className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md"
                >
                  <ShowLinkedIcon width="20px" height="20px" />
                </div>
              </Tooltip>
            )}

            <Tooltip placement="bottom" content="Delete Question">
              <div
                onClick={onDelete}
                className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md"
              >
                <TrashIcon width="20px" height="20px" />
              </div>
            </Tooltip>

            <Tooltip content="Duplicate Question" placement="bottom">
              <div
                onClick={onDuplication}
                className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md"
              >
                <CopyIcon width="20px" height="20px" />
              </div>
            </Tooltip>

            {isNotTextType && (
              <Switch
                onValueChange={handleRequireChange}
                isSelected={value.require}
                color="danger"
                size="sm"
              >
                Required
              </Switch>
            )}
          </div>
        </div>
        {!isNotConditioned &&
          conditionInfo.qIdx !== -1 &&
          !isNaN(conditionInfo.qIdx) && (
            <div
              onClick={handleConditionScroll}
              style={{ backgroundColor: color }}
              className="condition_indicator w-fit p-2 rounded-b-md text-white font-medium cursor-pointer hover:bg-gray-200"
            >
              {`Condition for Q${conditionInfo.qIdx + 1} option ${
                conditionInfo.ansIdx + 1
              }`}
            </div>
          )}
      </div>
    );
  }
);

QuestionComponent.displayName = "QuestionComponent";

export default QuestionComponent;
