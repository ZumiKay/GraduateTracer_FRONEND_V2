import { ChangeEvent, useCallback, useMemo, memo, useState } from "react";
import { ContentType, QuestionType, QuestionValidationIssue } from "../../types/Form.types";
import { SelectionType } from "../../types/Global.types";
import Selection from "./Selection";
import { Switch, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
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
import {
  getBackendQuestionIssues,
  mergeQuestionValidationIssues,
} from "../../utils/backendValidationIssues";
import {
  FiChevronDown,
  FiChevronRight,
  FiCheck,
  FiList,
  FiCheckSquare,
  FiHash,
  FiCalendar,
  FiSliders,
  FiType,
  FiAlignLeft,
  FiEdit3,
  FiLayers,
} from "react-icons/fi";

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

const QUESTION_TYPE_ITEMS: Array<{
  type: QuestionType;
  label: string;
  description: string;
}> = [
  {
    type: QuestionType.MultipleChoice,
    label: "Multiple Choice",
    description: "Single choice from a list of options",
  },
  {
    type: QuestionType.CheckBox,
    label: "CheckBox",
    description: "Multiple options can be selected",
  },
  {
    type: QuestionType.Number,
    label: "Number",
    description: "Numeric value input only",
  },
  {
    type: QuestionType.Date,
    label: "Date",
    description: "Single calendar date picker",
  },
  {
    type: QuestionType.RangeNumber,
    label: "RangeNumber",
    description: "Numeric scale with minimum and maximum",
  },
  {
    type: QuestionType.RangeDate,
    label: "RangeDate",
    description: "Date interval with start and end date",
  },
  {
    type: QuestionType.Selection,
    label: "Selection",
    description: "Single dropdown selection menu",
  },
  {
    type: QuestionType.MultipleSelection,
    label: "Multiple Selection",
    description: "Dropdown menu with multiple selections",
  },
  {
    type: QuestionType.Text,
    label: "Text",
    description: "Descriptive label or instructional text",
  },
  {
    type: QuestionType.ShortAnswer,
    label: "Short Answer",
    description: "Single-line short text response",
  },
  {
    type: QuestionType.Paragraph,
    label: "Paragraph",
    description: "Multi-line long paragraph response",
  },
];

const getTypeIcon = (type: QuestionType) => {
  switch (type) {
    case QuestionType.MultipleChoice:
      return <FiList className="w-4 h-4" />;
    case QuestionType.CheckBox:
      return <FiCheckSquare className="w-4 h-4" />;
    case QuestionType.Number:
      return <FiHash className="w-4 h-4" />;
    case QuestionType.Date:
    case QuestionType.RangeDate:
      return <FiCalendar className="w-4 h-4" />;
    case QuestionType.RangeNumber:
      return <FiSliders className="w-4 h-4" />;
    case QuestionType.Selection:
      return <FiChevronDown className="w-4 h-4" />;
    case QuestionType.MultipleSelection:
      return <FiLayers className="w-4 h-4" />;
    case QuestionType.Text:
      return <FiType className="w-4 h-4" />;
    case QuestionType.ShortAnswer:
      return <FiEdit3 className="w-4 h-4" />;
    case QuestionType.Paragraph:
      return <FiAlignLeft className="w-4 h-4" />;
    default:
      return <FiList className="w-4 h-4" />;
  }
};

const getCurrentTypeLabel = (type: QuestionType) => {
  const match = QuestionTypeOptions.find((opt) => opt.value === type);
  return match?.label ?? type;
};

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
  validationIssue?: QuestionValidationIssue[] | QuestionValidationIssue | string;
  validationWarning?: QuestionValidationIssue[] | QuestionValidationIssue | string;
}

interface ValidationToggleContainerProps {
  validationIssue?: QuestionValidationIssue[] | QuestionValidationIssue | string;
  validationWarning?: QuestionValidationIssue[] | QuestionValidationIssue | string;
}

const ValidationToggleContainer = memo(
  ({ validationIssue, validationWarning }: ValidationToggleContainerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const { errors, warnings } = useMemo(() => {
      const errs: QuestionValidationIssue[] = [];
      const warns: QuestionValidationIssue[] = [];

      const processItem = (
        item: QuestionValidationIssue[] | QuestionValidationIssue | string | undefined,
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
      <div className="w-full sm:w-[97%] transition-all duration-200">
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
              className={`w-4 h-4 flex-shrink-0 ${hasErrors ? "text-red-500" : "text-amber-500"}`}
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
                {warnings.length} {warnings.length === 1 ? "Warning" : "Warnings"}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

const selectAllQuestions = (state: RootState) => state.allform.allquestion;
const selectAutosave = (state: RootState) => state.allform.formstate.setting?.autosave;
const selectFormSettings = (state: RootState) => state.allform.formstate.setting;
const selectBackendValidation = (state: RootState) =>
  state.allform.formstate.validation?.validationResults;

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
    const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(true);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    const allquestion = useSelector(selectAllQuestions);
    const autosave = useSelector(selectAutosave);
    const formSettings = useSelector(selectFormSettings);

    const backendValidation = useSelector(selectBackendValidation);

    // Realtime (frontend) issues come with the question state; backend issues are added on top
    const activeValidationWarning = value.validationWarning;
    const activeValidationIssue = useMemo(() => {
      const frontendIssues = value.validationIssues ?? [];
      const backendIssues = getBackendQuestionIssues(backendValidation, value);
      const frontendAll = [...frontendIssues, ...(value.validationWarning ?? [])];
      const merged = mergeQuestionValidationIssues(frontendAll, backendIssues);
      return [...frontendIssues, ...merged.slice(frontendAll.length)];
    }, [backendValidation, value]);

    // Use qcolor from form settings, fallback to color prop
    const themeColor = useMemo(
      () => formSettings?.qcolor || color || "#6366f1",
      [formSettings?.qcolor, color],
    );

    //QuestionId included Array Idx
    const questionId = useMemo(() => value._id ?? idx, [idx, value._id]);

    const conditionInfo = useMemo(() => value.parentcontent, [value.parentcontent]);
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
    }, [value, isLinked, onUpdateState, onAddCondition, removeCondition, scrollToCondition]);

    const selectQuestionType = useCallback(
      (val: QuestionType) => {
        if (val === value.type) return;
        const ToBeDeleteType = value[value.type] as Record<string, unknown> | null;

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
                      type: val,
                      [value.type]: null,
                    });
                  },
                },
              },
            }),
          );
        } else {
          onUpdateState({
            type: val,
            [value.type]: undefined,
          });
        }
      },
      [dispatch, onUpdateState, value],
    );

    const handleChangeQuestionType = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        selectQuestionType(e.target.value as QuestionType);
      },
      [selectQuestionType],
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
        className="w-full max-w-full min-w-0 h-fit flex flex-col rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 sm:border-l-6 md:border-l-8 items-center gap-y-3 sm:gap-y-4 md:gap-y-5 py-4 sm:py-6 relative dark:border-gray-700 px-2 sm:px-4"
        style={{ borderLeftColor: themeColor }}
      >
        {/* Question Number Badge */}
        <div
          style={{
            backgroundColor: themeColor,
            boxShadow: `0 4px 14px 0 ${themeColor}40`,
          }}
          className="question_count absolute -top-3 sm:-top-3.5 left-3 sm:left-6 rounded-full font-bold text-white px-3 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm shadow-md z-10 select-none"
        >
          {`Q${value.questionId}`}
        </div>

        {/* Title and Type Selection */}
        <div className="text_editor w-full max-w-full min-w-0 bg-gray-50 dark:bg-gray-700 p-2.5 sm:p-4 rounded-xl flex flex-row max-lg:flex-wrap-reverse items-stretch max-lg:items-center  justify-start max-lg:justify-center gap-3 border border-gray-200 dark:border-gray-600">
          <div className="canvas w-full max-w-full min-w-0 h-full dark:rounded-lg dark:p-2 dark:bg-white min-h-[44px]">
            <Tiptap qidx={idx} value={value.title as never} onChange={handleTitleChange as never} />
          </div>
          {/* Desktop Type Selection */}
          <div className="hidden md:block md:w-52 xl:w-64 shrink-0">
            <Selection
              className="w-full rounded-md"
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
          {/* Mobile Type Selection Trigger in editor area */}
          <div className="block md:hidden w-full shrink-0">
            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-primary active:scale-[0.99] transition-all cursor-pointer shadow-xs"
              aria-label="Change Question Type"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  style={{ color: themeColor }}
                  className="w-5 h-5 flex items-center justify-center shrink-0"
                >
                  {getTypeIcon(value.type)}
                </span>
                <span className="text-gray-500 font-normal">Type:</span>
                <span className="text-primary font-bold truncate">
                  {getCurrentTypeLabel(value.type)}
                </span>
              </span>
              <span className="text-[11px] text-primary flex items-center gap-0.5 shrink-0 ml-2">
                Change
                <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </span>
            </button>
          </div>
        </div>

        {/* Question Content Area */}
        {isNotTextType && (
          <div className="content_container w-full max-w-full min-w-0 h-fit bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[50px] p-2.5 sm:p-4 border border-gray-200 dark:border-gray-600">
            {renderContentBaseOnQuestionType()}
          </div>
        )}

        {/* Desktop Action Buttons Section */}
        <div className="detail_section hidden md:flex w-fit h-[40px] flex-row self-end gap-x-3 mt-1 mr-2 sm:mr-4">
          <div className="danger_section w-fit h-full self-end p-2 mr-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-row items-center gap-x-3 shadow-sm">
            {value.conditional && value.conditional.length > 0 && (
              <Tooltip placement="bottom" content="Show Linked Question">
                <div
                  onClick={() => onShowLinkedQuestions?.(questionId)}
                  style={{
                    backgroundColor: currentShowState ? themeColor + "20" : "transparent",
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

        {/* Conditional Indicator Badge (Mobile) */}
        {!isNotConditioned &&
          conditionInfo?.qIdx &&
          conditionInfo?.qIdx !== -1 &&
          !isNaN(conditionInfo.qIdx as number) && (
            <div className="w-full flex justify-end md:hidden px-1">
              <div
                style={{
                  backgroundColor: themeColor,
                  boxShadow: `0 2px 8px 0 ${themeColor}40`,
                }}
                className="condition_indicator px-3 py-1.5 rounded-full text-white text-[11px] font-medium shadow-sm"
              >
                {`Linked to Q${conditionInfo.questionId} • Option ${conditionInfo.optIdx + 1}`}
              </div>
            </div>
          )}

        {/* Validation Toggle Container */}
        <div className="w-full max-w-full min-w-0">
          <ValidationToggleContainer
            validationIssue={activeValidationIssue}
            validationWarning={activeValidationWarning}
          />
        </div>

        {/* Mobile Floating Toolbar & Type Selection Container */}
        <div className="mobile_floating_container md:hidden sticky z-30 w-full max-w-full px-0.5 mt-1 transition-all duration-300">
          <div
            className="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border-2 shadow-2xl transition-all duration-200 overflow-hidden"
            style={{
              borderColor: `${themeColor}60`,
              boxShadow: `0 10px 25px -5px ${themeColor}35, 0 8px 10px -6px rgba(0, 0, 0, 0.15)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40">
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: themeColor }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs"
                >
                  Q{value.questionId}
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Toolbar & Type
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileControlsOpen((prev) => !prev)}
                className="px-2 py-0.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                aria-label={isMobileControlsOpen ? "Collapse controls" : "Expand controls"}
              >
                <span>{isMobileControlsOpen ? "Hide" : "Show"}</span>
                <FiChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMobileControlsOpen ? "" : "rotate-180"
                  }`}
                />
              </button>
            </div>

            {isMobileControlsOpen ? (
              <div className="p-2.5 sm:p-3 flex flex-col gap-2.5">
                {/* Question Type Selection Trigger on Mobile */}
                <div className="w-full">
                  <button
                    type="button"
                    onClick={() => setIsTypeModalOpen(true)}
                    aria-label="Select Question Type (Mobile)"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/80 border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary active:scale-[0.99] transition-all cursor-pointer text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{
                          backgroundColor: `${themeColor}18`,
                          color: themeColor,
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      >
                        {getTypeIcon(value.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-400">
                          Question Type
                        </span>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {getCurrentTypeLabel(value.type)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary shrink-0 text-xs font-medium ml-2">
                      <span>Change</span>
                      <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </button>
                </div>

                {/* Toolbar Action Buttons & Required Switch */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                  {/* Action Icons */}
                  <div className="flex items-center gap-1.5">
                    {value.conditional && value.conditional.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onShowLinkedQuestions?.(questionId)}
                        style={{
                          backgroundColor: currentShowState ? themeColor + "20" : undefined,
                          borderColor: currentShowState ? themeColor : undefined,
                        }}
                        className={`p-2 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                          currentShowState
                            ? "border-current"
                            : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                        title="Show Linked Questions"
                        aria-label="Show Linked Questions"
                      >
                        <ShowLinkedIcon
                          width="18px"
                          height="18px"
                          color={currentShowState ? themeColor : "#64748b"}
                        />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onDuplication}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 active:scale-95 transition-all cursor-pointer"
                      title="Duplicate Question"
                      aria-label="Duplicate Question"
                    >
                      <CopyIcon width="18px" height="18px" color="#3b82f6" />
                    </button>

                    <button
                      type="button"
                      onClick={onDelete}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 active:scale-95 transition-all cursor-pointer"
                      title="Delete Question"
                      aria-label="Delete Question"
                    >
                      <TrashIcon width="18px" height="18px" color="#ef4444" />
                    </button>
                  </div>

                  {/* Required Switch */}
                  {isNotTextType && (
                    <div className="flex items-center gap-1.5 pl-2">
                      <Switch
                        onValueChange={handleRequireChange}
                        isSelected={value.require}
                        color="danger"
                        size="sm"
                      >
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                          Required
                        </span>
                      </Switch>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Collapsed summary bar */
              <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(true)}
                  className="font-medium truncate max-w-[200px] text-left hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                  aria-label="Open Question Type Modal"
                >
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <strong className="text-gray-900 dark:text-white capitalize underline decoration-dotted underline-offset-2">
                    {getCurrentTypeLabel(value.type)}
                  </strong>
                </button>
                <div className="flex items-center gap-2">
                  {value.require && (
                    <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 text-[10px] font-bold">
                      Required
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileControlsOpen(true)}
                    className="text-primary text-xs font-medium hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conditional Indicator Badge (Desktop) */}
        {!isNotConditioned &&
          conditionInfo?.qIdx &&
          conditionInfo?.qIdx !== -1 &&
          !isNaN(conditionInfo.qIdx as number) && (
            <div
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 2px 8px 0 ${themeColor}40`,
              }}
              className="condition_indicator hidden md:block absolute -bottom-3 right-6 px-4 py-2 rounded-full text-white text-xs font-medium cursor-pointer hover:scale-105 transition-transform shadow-md"
            >
              {`Linked to Q${conditionInfo.questionId} • Option ${conditionInfo.optIdx + 1}`}
            </div>
          )}

        {/* Mobile Question Type Selection Modal */}
        <Modal
          isOpen={isTypeModalOpen}
          onClose={() => setIsTypeModalOpen(false)}
          size="md"
          placement="bottom-center"
          scrollBehavior="inside"
          backdrop="blur"
          classNames={{
            base: "max-w-md w-full mx-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl",
            header: "border-b border-gray-100 dark:border-gray-800 px-5 py-3.5",
            body: "p-4 max-h-[70vh] overflow-y-auto space-y-2",
            footer: "border-t border-gray-100 dark:border-gray-800 px-5 py-3",
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: themeColor }}
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                    >
                      Q{value.questionId}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Select Question Type
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                    Choose how respondents will answer this question
                  </p>
                </ModalHeader>

                <ModalBody>
                  {QUESTION_TYPE_ITEMS.map((item) => {
                    const isSelected = value.type === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          selectQuestionType(item.type);
                          setIsTypeModalOpen(false);
                          onClose?.();
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left active:scale-[0.98] ${
                          isSelected
                            ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-sm"
                            : "border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        aria-label={`Select ${item.label}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            style={{
                              backgroundColor: isSelected ? themeColor : undefined,
                              color: isSelected ? "#fff" : themeColor,
                            }}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "shadow-sm"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {getTypeIcon(item.type)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-sm font-semibold truncate ${
                                isSelected
                                  ? "text-primary dark:text-white font-bold"
                                  : "text-gray-800 dark:text-gray-100"
                              }`}
                            >
                              {item.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {item.description}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 text-white ml-2 shadow-xs">
                            <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </ModalBody>

                <ModalFooter className="flex justify-end">
                  <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    onPress={onClose}
                    className="font-medium cursor-pointer"
                  >
                    Cancel
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    );
  },
);

QuestionComponent.displayName = "QuestionComponent";

export default QuestionComponent;
