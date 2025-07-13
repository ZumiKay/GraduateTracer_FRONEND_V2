import { ChangeEvent, CSSProperties, useCallback, useMemo, memo } from "react";
import { ContentType, QuestionType } from "../../types/Form.types";
import { SelectionType } from "../../types/Global.types";
import Selection from "./Selection";
import { Switch, Tooltip } from "@heroui/react";
import { CopyIcon, TrashIcon } from "../svg/GeneralIcon";
import { useDispatch, useSelector } from "react-redux";
import { setallquestion, setdisbounceQuestion } from "../../redux/formstore";
import { RootState } from "../../redux/store";
import Tiptap from "./TipTabEditor";
import { setopenmodal } from "../../redux/openmodal";
import { DateRangePickerQuestionType } from "./Solution/Answer_Component";
import {
  ChoiceQuestionEdit,
  RangeQuestionEdit,
  SelectionQuestionEdit,
} from "./QuestionComponentAssets";

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
}

const QuestionComponent = memo(
  ({
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

    // Use specific selectors to avoid unnecessary re-renders
    const allquestion = useSelector(
      (root: RootState) => root.allform.allquestion,
      (prev, curr) => prev === curr
    );
    const autosave = useSelector(
      (root: RootState) => root.allform.formstate.setting?.autosave,
      (prev, curr) => prev === curr
    );

    const onUpdateState = useCallback(
      async (newVal: Partial<ContentType>) => {
        const updatedQuestions = allquestion.map((question, qidx) => {
          if ((question._id && question._id === id) || qidx === idx) {
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
      [allquestion, dispatch, id, idx, autosave]
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
          return <DateRangePickerQuestionType />;
        }
        case QuestionType.RangeNumber: {
          return (
            <RangeQuestionEdit
              questionstate={value}
              setquestionsate={onUpdateState}
              type={QuestionType.RangeNumber}
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
            [value.type]: null,
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
      const conditionInfo = isConditioned();
      scrollToCondition?.(conditionInfo.key);
    }, [isConditioned, scrollToCondition]);

    const styles: Record<string, CSSProperties> = useMemo(
      () => ({
        s1: {
          border: `15px solid ${color}`,
        },
        s2: {
          backgroundColor: color,
        },
      }),
      [color]
    );

    const conditionInfo = useMemo(() => isConditioned(), [isConditioned]);
    const isNotConditioned = conditionInfo.qIdx === -1;
    const isNotTextType = value.type !== QuestionType.Text;

    return (
      <div
        style={styles.s1}
        className="w-full h-fit flex flex-col rounded-md bg-white items-center gap-y-5 py-5 relative"
      >
        {isNotConditioned && (
          <div
            style={styles.s2}
            className="question_count absolute -top-10 right-[45%] rounded-t-md font-bold text-white p-2 w-[150px]"
          >
            {`Question ${idx + 1}`}
          </div>
        )}
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
            <Tooltip placement="bottom" content="Delete Question">
              <div
                onClick={onDelete}
                className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md"
              >
                <TrashIcon width={"20px"} height={"20px"} />
              </div>
            </Tooltip>

            <Tooltip content="Duplicate Question" placement="bottom">
              <div
                onClick={onDuplication}
                className="w-fit h-fit p-2 hover:bg-slate-200 rounded-md"
              >
                <CopyIcon width={"20px"} height={"20px"} />
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
        {!isNotConditioned && (
          <div
            style={styles.s2}
            onClick={handleConditionScroll}
            className="condition_indicator w-fit p-2 rounded-b-md text-white font-medium cursor-pointer hover:bg-gray-200 absolute bottom-[100%]"
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
