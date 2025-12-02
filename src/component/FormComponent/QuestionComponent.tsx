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
  scrollToCondition?: (key: number) => void;
  onShowLinkedQuestions?: (val: boolean) => void;
}

// Memoized selectors to prevent unnecessary re-renders
const selectAllQuestions = (state: RootState) => state.allform.allquestion;
const selectAutosave = (state: RootState) =>
  state.allform.formstate.setting?.autosave;
const selectShowLinkedQuestions = (state: RootState) =>
  state.allform.showLinkedQuestions;
const selectFormSettings = (state: RootState) =>
  state.allform.formstate.setting;

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
  }: QuestionComponentProps) => {
    const dispatch = useDispatch();

    const allquestion = useSelector(selectAllQuestions);
    const autosave = useSelector(selectAutosave);
    const allshowLinkedQuestions = useSelector(selectShowLinkedQuestions);
    const formSettings = useSelector(selectFormSettings);

    // Use qcolor from form settings, fallback to color prop
    const themeColor = useMemo(
      () => formSettings?.qcolor || color || "#6366f1",
      [formSettings?.qcolor, color]
    );

    const questionId = useMemo(
      () => value._id ?? `temp-question-${idx}`,
      [idx, value._id]
    );

    const conditionInfo = useMemo(
      () => value.parentcontent,
      [value.parentcontent]
    );
    const isNotConditioned = conditionInfo?.qIdx === -1;
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
      onUpdateState,
      onAddCondition,
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

    const handleShowLinkedQuestions = useCallback(() => {
      const currentState = allshowLinkedQuestions ?? [];
      const existingIndex = currentState.findIndex(
        (item) => item.question === questionId
      );

      const newState = [...currentState];
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

    return (
      <div
        className="w-full h-fit flex flex-col rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-8 items-center gap-y-5 py-6 relative dark:border-gray-700"
        style={{ borderLeftColor: themeColor }}
      >
        {/* Question Number Badge */}
        <div
          style={{
            backgroundColor: themeColor,
            boxShadow: `0 4px 14px 0 ${themeColor}40`,
          }}
          className="question_count absolute -top-4 left-6 rounded-full font-bold text-white px-5 py-2 text-sm shadow-md"
        >
          {`Q${value.questionId}`}
        </div>

        {/* Title and Type Selection */}
        <div className="text_editor w-[97%] bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex flex-row items-start justify-start gap-x-4 border border-gray-200 dark:border-gray-600">
          <div className="canvas w-full h-full dark:rounded-lg dark:p-2 dark:bg-white">
            <Tiptap
              qidx={idx}
              value={value.title as never}
              onChange={handleTitleChange as never}
            />
          </div>
          <Selection
            className="max-w-sm rounded-md"
            name="type"
            radius="md"
            color="default"
            placeholder="Question Type"
            selectedKeys={[value.type]}
            items={QuestionTypeOptions}
            defaultSelectedKeys={[value.type]}
            onChange={handleChangeQuestionType}
            aria-label="Select Question Type"
          />
        </div>

        {/* Question Content Area */}
        {isNotTextType && (
          <div className="content_container w-[97%] h-fit bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[50px] p-4 border border-gray-200 dark:border-gray-600">
            {renderContentBaseOnQuestionType()}
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="detail_section w-fit h-[40px] flex flex-row self-end gap-x-3 mt-2">
          <div className="danger_section w-fit h-full self-end p-2 mr-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-row items-center gap-x-3 shadow-sm">
            {value.conditional && value.conditional.length > 0 && (
              <Tooltip placement="bottom" content="Show Linked Question">
                <div
                  onClick={handleShowLinkedQuestions}
                  style={{
                    backgroundColor: currentShowState
                      ? themeColor + "20"
                      : "transparent",
                    borderColor: currentShowState ? themeColor : "transparent",
                  }}
                  className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md cursor-pointer transition-all border"
                >
                  <ShowLinkedIcon
                    width="20px"
                    height="20px"
                    color={currentShowState ? themeColor : "#64748b"}
                  />
                </div>
              </Tooltip>
            )}

            <Tooltip placement="bottom" content="Delete Question">
              <div
                onClick={onDelete}
                className="w-fit h-fit p-2 hover:bg-red-50 rounded-md cursor-pointer transition-all"
              >
                <TrashIcon width="20px" height="20px" color="#ef4444" />
              </div>
            </Tooltip>

            <Tooltip content="Duplicate Question" placement="bottom">
              <div
                onClick={onDuplication}
                className="w-fit h-fit p-2 hover:bg-blue-50 rounded-md cursor-pointer transition-all"
              >
                <CopyIcon width="20px" height="20px" color="#3b82f6" />
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

        {/* Conditional Indicator Badge */}
        {!isNotConditioned &&
          conditionInfo?.qIdx &&
          conditionInfo?.qIdx !== -1 &&
          !isNaN(conditionInfo.qIdx as number) && (
            <div
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 2px 8px 0 ${themeColor}40`,
              }}
              className="condition_indicator absolute -bottom-3 right-6 px-4 py-2 rounded-full text-white text-xs font-medium cursor-pointer hover:scale-105 transition-transform shadow-md"
            >
              {`Linked to Q${conditionInfo.questionId} • Option ${
                conditionInfo.optIdx + 1
              }`}
            </div>
          )}
      </div>
    );
  }
);

QuestionComponent.displayName = "QuestionComponent";

export default QuestionComponent;
