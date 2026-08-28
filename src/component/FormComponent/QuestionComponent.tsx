import { ChangeEvent, useCallback, useMemo, memo, useState } from "react";
import {
  ContentType,
  QuestionType,
  QuestionValidationIssue,
} from "../../types/Form.types";
import { SelectionType } from "../../types/Global.types";
import Selection from "./Selection";
import { Switch, Tooltip } from "@heroui/react";
import { CopyIcon, ShowLinkedIcon, TrashIcon } from "../svg/GeneralIcon";
import { useDispatch, useSelector } from "react-redux";
import { setallquestion } from "../../redux/formstore";
import { emitAutoSaveEvent } from "../../services/autoSaveEventBus";
import { RootState } from "../../redux/store";
import Tiptap from "./TipTabEditor";
import { setopenmodal } from "../../redux/openmodal";
import {
  ChoiceQuestionEdit,
  RangeNumberInputComponent,
  SelectionQuestionEdit,
} from "./QuestionComponentAssets";
import { DateRangePickerQuestionType } from "./Solution/Answer_Component";
import { isQuestionsLinkedVisible } from "../../utils/questionMutataions";

const QuestionTypeOptions: Array<SelectionType<QuestionType>> = [
  { label: "Multiple Choice", value: QuestionType.MultipleChoice },
  { label: "CheckBox", value: QuestionType.CheckBox },
  { label: "Number", value: QuestionType.Number },
  { label: "Date", value: QuestionType.Date },
  { label: "RangeNumber", value: QuestionType.RangeNumber },
  { label: "RangeDate", value: QuestionType.RangeDate },
  { label: "Selection", value: QuestionType.Selection },
  { label: "Multiple Selection", value: QuestionType.MultipleSelection },
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
  onShowLinkedQuestions?: (questionId: string | number) => void;
  validationIssue?:
    | QuestionValidationIssue[]
    | QuestionValidationIssue
    | string;
  validationWarning?:
    | QuestionValidationIssue[]
    | QuestionValidationIssue
    | string;
}

interface ValidationToggleContainerProps {
  validationIssue?:
    | QuestionValidationIssue[]
    | QuestionValidationIssue
    | string;
  validationWarning?:
    | QuestionValidationIssue[]
    | QuestionValidationIssue
    | string;
}

const ValidationToggleContainer = memo(
  ({ validationIssue, validationWarning }: ValidationToggleContainerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const { errors, warnings } = useMemo(() => {
      const errs: QuestionValidationIssue[] = [];
      const warns: QuestionValidationIssue[] = [];

      const processItem = (
        item:
          | QuestionValidationIssue[]
          | QuestionValidationIssue
          | string
          | undefined,
        defaultType: "error" | "warning",
      ) => {
        if (!item) return;
        if (Array.isArray(item)) {
          item.forEach((i) => {
            if (typeof i === "string") {
              (defaultType === "error" ? errs : warns).push({
                type: defaultType,
                message: i,
              });
            } else if (i && typeof i === "object" && "message" in i) {
              const t = i.type || defaultType;
              if (t === "error") errs.push(i);
              else warns.push(i);
            }
          });
        } else if (typeof item === "string") {
          (defaultType === "error" ? errs : warns).push({
            type: defaultType,
            message: item,
          });
        } else if (typeof item === "object" && "message" in item) {
          const t = item.type || defaultType;
          if (t === "error") errs.push(item);
          else warns.push(item);
        }
      };

      processItem(validationIssue, "error");
      processItem(validationWarning, "warning");

      return { errors: errs, warnings: warns };
    }, [validationIssue, validationWarning]);

    if (errors.length === 0 && warnings.length === 0) return null;

    const hasErrors = errors.length > 0;

    return (
      <div className="w-[97%] transition-all duration-200">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
            hasErrors
              ? "bg-red-50/80 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800/60 dark:text-red-300"
              : "bg-amber-50/80 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300"
          }`}
          aria-expanded={isOpen}
          aria-label="Toggle validation details"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <svg
              className={`w-4 h-4 flex-shrink-0 ${
                hasErrors ? "text-red-500" : "text-amber-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="font-semibold">Validation</span>

            {errors.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                {errors.length} {errors.length === 1 ? "Error" : "Errors"}
              </span>
            )}

            {warnings.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {warnings.length}{" "}
                {warnings.length === 1 ? "Warning" : "Warnings"}
              </span>
            )}
          </div>

          <svg
            className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            } ${hasErrors ? "text-red-500" : "text-amber-500"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="mt-1.5 space-y-1.5">
            {errors.map((err, i) => (
              <div
                key={`err-${i}`}
                className="flex items-start gap-2 px-3 py-1.5 rounded-md text-xs bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/40"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="leading-relaxed">{err.message}</span>
              </div>
            ))}
            {warnings.map((warn, i) => (
              <div
                key={`warn-${i}`}
                className="flex items-start gap-2 px-3 py-1.5 rounded-md text-xs bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="leading-relaxed">{warn.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

ValidationToggleContainer.displayName = "ValidationToggleContainer";

// Memoized selectors to prevent unnecessary re-renders
const selectAllQuestions = (state: RootState) => state.allform.allquestion;
const selectAutosave = (state: RootState) =>
  state.allform.formstate.setting?.autosave;
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
    onShowLinkedQuestions,
  }: QuestionComponentProps) => {
    const dispatch = useDispatch();

    const allquestion = useSelector(selectAllQuestions);
    const autosave = useSelector(selectAutosave);
    const formSettings = useSelector(selectFormSettings);

    const activeValidationIssue = value.validationIssues;
    const activeValidationWarning = value.validationWarning;

    // Use qcolor from form settings, fallback to color prop
    const themeColor = useMemo(
      () => formSettings?.qcolor || color || "#6366f1",
      [formSettings?.qcolor, color],
    );

    //QuestionId included Array Idx
    const questionId = useMemo(() => value._id ?? idx, [idx, value._id]);

    const conditionInfo = useMemo(
      () => value.parentcontent,
      [value.parentcontent],
    );
    const isNotConditioned = conditionInfo?.qIdx === -1;
    const isNotTextType = value.type !== QuestionType.Text;

    //IsLinkedQuestionVisible
    const currentShowState = useMemo(
      () => isQuestionsLinkedVisible({ target: value._id ?? idx, allquestion }),
      [allquestion, idx, value._id],
    );

    const onUpdateState = useCallback(
      async (newVal: Partial<ContentType>) => {
        const updatedQuestions = allquestion.map((question, qidx) => {
          if ((question._id && question._id === value._id) || qidx === idx) {
            const updatedQuestion = { ...question, ...newVal };

            if (autosave) {
              // The autosave hook listens for this and debounces the request.
              emitAutoSaveEvent({
                tab: "question",
                questionId: updatedQuestion._id ?? idx,
              });
            }

            return updatedQuestion;
          }

          return question;
        });

        dispatch(setallquestion(updatedQuestions as Array<ContentType>));
      },
      [allquestion, dispatch, value._id, idx, autosave],
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
        case QuestionType.MultipleSelection:
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
            }),
          );
        } else {
          onUpdateState({
            type: val as QuestionType,
            [value.type]: undefined,
          });
        }
      },
      [dispatch, onUpdateState, value],
    );

    const handleTitleChange = useCallback(
      (val: string) => onUpdateState({ title: val }),
      [onUpdateState],
    );

    const handleRequireChange = useCallback(
      (val: boolean) => onUpdateState({ require: val }),
      [onUpdateState],
    );

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
                  onClick={() => onShowLinkedQuestions?.(questionId)}
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

        {/* Validation Toggle Container */}
        <ValidationToggleContainer
          validationIssue={activeValidationIssue}
          validationWarning={activeValidationWarning}
        />

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
  },
);

QuestionComponent.displayName = "QuestionComponent";

export default QuestionComponent;
