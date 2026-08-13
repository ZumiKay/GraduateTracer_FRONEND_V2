import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
} from "@heroui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import {
  ContentType,
  DefaultContentType,
  ErrorValidataionPropsType,
  FormDataType,
  QuestionType,
  QuestionValidationIssue,
  ValidationResult,
} from "../../../types/Form.types";
import { useSetSearchParam } from "../../../hooks/CustomHook";
import { useFormValidation } from "../../Response";
import {
  setallquestion,
  setformstate,
  setShowOverview,
  setvalidation,
} from "../../../redux/formstore";
import { alltabs } from "../../../pages/FormPage";

type ShowAsType = "cards" | "compact";
type SeverityType = "warning" | "error";

interface IssueItem {
  id: string;
  severity: SeverityType;
  label: string;
  message?: string;
  question?: ContentType;
  targetId?: string | number;
  page?: number;
}

/**
 * Extract per-question validation issues from combined validation results.
 * Returns a Map keyed by question _id or qIdx string.
 */
function extractValidationIssuesMap(
  validationResults?: ValidationResult,
): Map<string, QuestionValidationIssue[]> {
  const map = new Map<string, QuestionValidationIssue[]>();
  if (!validationResults) return map;

  const getIssueMessage = (
    item: ErrorValidataionPropsType,
    fallback: string,
  ): string => {
    if (!item.message) return fallback;
    if (typeof item.message === "string") return item.message;
    if (typeof item.message === "object" && item.message.message) {
      return item.message.message;
    }
    return fallback;
  };

  const addIssue = (
    item: ErrorValidataionPropsType,
    type: "error" | "warning",
    message: string,
  ) => {
    const key = item._id || String(item.qIdx ?? "");
    if (!key) return;
    const existing = map.get(key) || [];
    existing.push({ type, message });
    map.set(key, existing);
  };

  validationResults.errors?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(
        item,
        "error",
        getIssueMessage(item, `Validation error on ${item.questionId}`),
      );
    }
  });
  validationResults.warnings?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(
        item,
        "warning",
        getIssueMessage(item, `Warning on ${item.questionId}`),
      );
    }
  });
  validationResults.missingAnswers?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "error", getIssueMessage(item, "Missing answer key"));
    }
  });
  validationResults.missingScores?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "warning", getIssueMessage(item, "Missing score value"));
    }
  });
  validationResults.wrongScores?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "error", getIssueMessage(item, "Invalid score setting"));
    }
  });

  return map;
}

const knownQuestionTypes = new Set(Object.values(QuestionType));
const defaultTitleSignature = JSON.stringify(DefaultContentType.title ?? null);

const buildQuestionLabel = (question: ContentType) =>
  `Question ${question.questionId || question.qIdx}`;

const getQuestionKey = (question: ContentType, idx: number) =>
  question._id || `${question.qIdx}-${idx}`;

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`h-4 w-4 transition-transform duration-200 ${
      isOpen ? "rotate-180" : ""
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ChartBarIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

interface OverviewContainerProps {
  loading?: boolean;
  tab: alltabs;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

const OverviewContainer = ({
  loading = false,
  tab,
}: OverviewContainerProps) => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { validateFormReq, processedTotalScore } = useFormValidation();
  const [showAs, setShowAs] = useState<ShowAsType>("cards");
  const showOverview = useSelector(
    (root: RootState) => root.allform.showOverview,
  );
  const [isContentVisible, setIsContentVisible] = useState(
    showOverview || false,
  );

  useEffect(() => {
    if (showOverview !== undefined) {
      setIsContentVisible(showOverview);
    }
  }, [showOverview]);

  const { setParams } = useSetSearchParam();
  const allQuestion = useSelector(
    (root: RootState) => root.allform.allquestion,
  );
  const formState = useSelector((root: RootState) => root.allform.formstate);

  const totalQuestion = formState.totalQuestions || 0;
  const totalConditionQuestion = formState.totalConditions;
  const totalPage = formState.totalpage || 0;

  const validation = formState.validation?.validationResults;

  const createIssueFromItem = useCallback(
    (
      item: ErrorValidataionPropsType,
      fallbackId: string,
      severity: SeverityType,
    ): IssueItem => {
      const matchingQ = allQuestion.find(
        (q) =>
          (item._id && q._id === item._id) ||
          (item.qIdx !== undefined && q.qIdx === item.qIdx),
      );
      return {
        id: `${severity}-${item.questionId || item.qIdx || fallbackId}`,
        severity,
        label:
          item.questionId ||
          (item.qIdx !== undefined ? `Question ${item.qIdx}` : fallbackId),
        question: matchingQ,
        targetId: item._id || item.qIdx,
        page: item.page || matchingQ?.page || 1,
      };
    },

    [allQuestion],
  );

  const issues = useMemo(() => {
    const result: IssueItem[] = [];

    //Realtime validation while editing
    allQuestion.forEach((question, idx) => {
      const label = buildQuestionLabel(question);
      const key = getQuestionKey(question, idx);

      if (!knownQuestionTypes.has(question.type)) {
        result.push({
          id: `${key}-wrong-qtype`,
          severity: "error",
          label,
          message: "Wrong QType detected.",
          question,
          targetId: question._id || question.qIdx,
          page: question.page || 1,
        });
      }

      const titleSignature = JSON.stringify(question.title ?? null);
      if (titleSignature === defaultTitleSignature) {
        result.push({
          id: `${key}-default-content`,
          severity: "error",
          label,
          message: "Default content is not changed.",
          question,
          targetId: question._id || question.qIdx,
          page: question.page || 1,
        });
      }
    });

    if (validation?.warnings?.length) {
      validation.warnings.forEach(
        (warning: ErrorValidataionPropsType, idx: number) => {
          result.push(
            createIssueFromItem(warning, `Warning ${idx + 1}`, "warning"),
          );
        },
      );
    }

    if (validation?.errors?.length) {
      validation.errors.forEach(
        (error: ErrorValidataionPropsType, idx: number) => {
          result.push(createIssueFromItem(error, `Error ${idx + 1}`, "error"));
        },
      );
    }

    if (validation?.missingAnswers?.length) {
      validation.missingAnswers.forEach(
        (item: ErrorValidataionPropsType, idx: number) => {
          result.push(
            createIssueFromItem(item, `missing-answer-${idx}`, "error"),
          );
        },
      );
    }

    if (validation?.missingScores?.length) {
      validation.missingScores.forEach(
        (item: ErrorValidataionPropsType, idx: number) => {
          result.push(
            createIssueFromItem(item, `missing-score-${idx}`, "warning"),
          );
        },
      );
    }

    if (validation?.wrongScores?.length) {
      validation.wrongScores.forEach(
        (item: ErrorValidataionPropsType, idx: number) => {
          result.push(createIssueFromItem(item, `wrong-score-${idx}`, "error"));
        },
      );
    }

    return result;
  }, [allQuestion, validation, createIssueFromItem]);

  const warningIssues = useMemo(
    () => issues.filter((item) => item.severity === "warning"),
    [issues],
  );
  const errorIssues = useMemo(
    () => issues.filter((item) => item.severity === "error"),
    [issues],
  );

  //Temporary Highlight Question Card
  const highlightQuestionCard = (
    targetElement: HTMLElement,
    issueType: "warning" | "error",
  ) => {
    targetElement.classList.add(
      "ring-4",
      `ring-${issueType === "error" ? "red" : "yellow"}-500`,
      "ring-offset-10",
      "shadow-2xl",
      "transition-all",
      "duration-300",
    );

    setTimeout(() => {
      targetElement.classList.remove(
        "ring-4",
        `ring-${issueType === "error" ? "red" : "yellow"}-500`,
        "ring-offset-10",
        "shadow-2xl",
      );
    }, 3000);
  };

  const scrollToAndHighlightQuestion = (
    issuetype: SeverityType,
    targetId?: string,
  ) => {
    if (!targetId) return;

    let attempts = 0;
    const maxAttempts = 40; // 4 seconds max polling timeout

    const interval = setInterval(() => {
      attempts++;
      const element = document.getElementById(targetId);

      if (element) {
        clearInterval(interval);
        (element as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        highlightQuestionCard(element as HTMLElement, issuetype);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);
  };

  const handleQuestionCardClick = (issue: IssueItem, type: SeverityType) => {
    if (isMobile) {
      setIsContentVisible(false);
      dispatch(setShowOverview(false));
    }

    const targetPage = issue.question?.page || issue.page || 1;
    const targetId =
      issue.question?._id || issue.question?.qIdx || issue.targetId;

    setParams({
      tab: tab || "question",
      page: String(targetPage),
    });

    if (targetId !== undefined) {
      scrollToAndHighlightQuestion(
        type,
        `${issue?.page ?? 1}-${issue.targetId}`,
      );
    }
  };

  const handleValidateAll = useCallback(() => {
    if (!formState._id) return;

    validateFormReq.mutate(
      { formId: formState._id, tab },
      {
        onSuccess(res) {
          const validatedData = res.data as FormDataType;
          if (!validatedData.validation) return;

          if (tab === "question") {
            dispatch(setformstate({ ...formState, ...validatedData }));
          } else {
            dispatch(setvalidation({ validation: validatedData.validation }));
          }

          // Attach per-question validation issues to allquestion
          const issueMap = extractValidationIssuesMap(
            validatedData.validation.validationResults,
          );
          dispatch(
            setallquestion((prev: ContentType[]) =>
              prev.map((q) => {
                const key = q._id || String(q.qIdx);
                return {
                  ...q,
                  validationIssues: issueMap.get(key) ?? [],
                };
              }),
            ),
          );
        },
      },
    );
  }, [dispatch, formState, tab, validateFormReq]);

  const statsCardClass =
    "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900";

  const renderOverviewContent = () => (
    <div className="space-y-6 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {tab === "question" ? (
          <>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Total Question
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {totalQuestion}
                </span>
              </CardBody>
            </Card>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Total Condition Question
                </span>
                <span className="text-2xl font-bold text-amber-600">
                  {totalConditionQuestion}
                </span>
              </CardBody>
            </Card>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Total Page
                </span>
                <span className="text-2xl font-bold text-violet-600">
                  {totalPage}
                </span>
              </CardBody>
            </Card>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Warning & Error
                </span>
                <div className="flex items-center gap-2">
                  <Chip size="sm" color="warning" variant="flat">
                    {warningIssues.length} Warning
                  </Chip>
                  <Chip size="sm" color="danger" variant="flat">
                    {errorIssues.length} Error
                  </Chip>
                </div>
              </CardBody>
            </Card>
          </>
        ) : (
          <>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Total Score
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  {processedTotalScore({
                    allQuestion: allQuestion,
                    formState,
                  })}
                </span>
              </CardBody>
            </Card>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Total Question
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {totalQuestion}
                </span>
              </CardBody>
            </Card>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Total Condition Question
                </span>
                <span className="text-2xl font-bold text-amber-600">
                  {totalConditionQuestion}
                </span>
              </CardBody>
            </Card>
            <Card className={statsCardClass} shadow="sm">
              <CardBody className="gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Warning & Error
                </span>
                <div className="flex items-center gap-2">
                  <Chip size="sm" color="warning" variant="flat">
                    {warningIssues.length} Warning
                  </Chip>
                  <Chip size="sm" color="danger" variant="flat">
                    {errorIssues.length} Error
                  </Chip>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          className="rounded-xl border border-amber-200 dark:border-amber-800"
          shadow="sm"
        >
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-amber-700 dark:text-amber-300">
                Warning
              </h3>
              <Chip size="sm" color="warning" variant="flat">
                {warningIssues.length}
              </Chip>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
              {warningIssues.length === 0 ? (
                <p className="text-sm text-gray-500">No warning found.</p>
              ) : (
                warningIssues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    className="w-full text-left rounded-lg border border-amber-100 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/20 px-3 py-2 hover:bg-amber-100/80 dark:hover:bg-amber-900/35 transition-colors"
                    onClick={() => handleQuestionCardClick(issue, "warning")}
                  >
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {issue.label}
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      {issue.message}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card
          className="rounded-xl border border-red-200 dark:border-red-800"
          shadow="sm"
        >
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-red-700 dark:text-red-300">
                Error
              </h3>
              <Chip size="sm" color="danger" variant="flat">
                {errorIssues.length}
              </Chip>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
              {errorIssues.length === 0 ? (
                <p className="text-sm text-gray-500">No error found.</p>
              ) : (
                errorIssues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    className="w-full text-left rounded-lg border border-red-100 dark:border-red-700 bg-red-50/60 dark:bg-red-900/20 px-3 py-2 hover:bg-red-100/80 dark:hover:bg-red-900/35 transition-colors"
                    onClick={() => handleQuestionCardClick(issue, "error")}
                  >
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                      {issue.label}
                    </p>
                    <p className="text-sm text-red-900 dark:text-red-100">
                      {issue.message}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  if (isContentVisible && loading && validateFormReq.isPending) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="OverviewContainer w-full h-fit px-4 md:px-8 pt-3 pb-5 space-y-4">
      <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-black/80 border-b border-gray-200/80 dark:border-gray-700/80">
        <div className="flex flex-wrap items-center justify-between md:justify-start gap-2">
          <Button
            size="sm"
            variant="solid"
            color={errorIssues.length > 0 ? "danger" : "primary"}
            className="font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-xl px-3.5 py-1.5"
            onPress={() => {
              const nextVisible = !isContentVisible;
              setIsContentVisible(nextVisible);
              dispatch(setShowOverview(nextVisible));
            }}
            aria-expanded={isContentVisible}
            aria-controls="overview-content"
          >
            <span className="flex items-center gap-2 font-bold text-white">
              <ChartBarIcon />
              <span>
                {isMobile
                  ? "Overview"
                  : isContentVisible
                    ? "Hide Overview"
                    : "Show Overview"}
              </span>
              {errorIssues.length > 0 ? (
                <Chip
                  size="sm"
                  color="warning"
                  variant="solid"
                  className="min-w-5 h-5 px-1 text-[10px] font-extrabold bg-white text-red-600 dark:bg-gray-900 dark:text-red-400"
                >
                  {errorIssues.length}
                </Chip>
              ) : warningIssues.length > 0 ? (
                <Chip
                  size="sm"
                  variant="solid"
                  className="min-w-5 h-5 px-1 text-[10px] font-extrabold bg-white text-amber-600 dark:bg-gray-900 dark:text-amber-400"
                >
                  {warningIssues.length}
                </Chip>
              ) : null}
              <ChevronDownIcon isOpen={isContentVisible} />
            </span>
          </Button>

          <div
            hidden={!isContentVisible && !isMobile}
            className="flex flex-wrap items-center gap-2"
          >
            <Button
              size="sm"
              color="primary"
              variant="solid"
              onPress={handleValidateAll}
              isLoading={validateFormReq.isPending}
              isDisabled={!formState._id || validateFormReq.isPending}
              className="rounded-xl shadow-sm"
            >
              Validate All
            </Button>

            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 px-2">
                Show As
              </span>
              <Button
                size="sm"
                variant={showAs === "cards" ? "solid" : "light"}
                color="primary"
                onPress={() => setShowAs("cards")}
                className="rounded-lg text-xs"
              >
                Cards
              </Button>
              <Button
                size="sm"
                variant={showAs === "compact" ? "solid" : "light"}
                color="primary"
                onPress={() => setShowAs("compact")}
                className="rounded-lg text-xs"
              >
                Compact
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View: Collapsible Container */}
      {!isMobile && (
        <div
          id="overview-content"
          className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
            isContentVisible
              ? "grid-rows-[1fr] opacity-100 mt-0"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="min-h-0">{renderOverviewContent()}</div>
        </div>
      )}

      {/* Mobile View: HeroUI Modal */}
      {isMobile && (
        <Modal
          isOpen={isContentVisible}
          onClose={() => {
            setIsContentVisible(false);
            dispatch(setShowOverview(false));
          }}
          size="full"
          scrollBehavior="inside"
          backdrop="blur"
          classNames={{
            base: "dark:bg-gray-900 bg-white m-0 rounded-none max-h-screen",
            header: "border-b border-gray-200 dark:border-gray-800 p-4",
            body: "p-4 sm:p-6",
            footer: "border-t border-gray-200 dark:border-gray-800 p-3",
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800 dark:text-white">
                      Form Overview
                    </span>
                    {errorIssues.length > 0 ? (
                      <Chip size="sm" color="danger" variant="flat">
                        {errorIssues.length} Error
                        {errorIssues.length > 1 ? "s" : ""}
                      </Chip>
                    ) : warningIssues.length > 0 ? (
                      <Chip size="sm" color="warning" variant="flat">
                        {warningIssues.length} Warning
                        {warningIssues.length > 1 ? "s" : ""}
                      </Chip>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mr-6">
                    <Button
                      size="sm"
                      color="primary"
                      variant="solid"
                      onPress={handleValidateAll}
                      isLoading={validateFormReq.isPending}
                      isDisabled={!formState._id || validateFormReq.isPending}
                      className="rounded-xl shadow-sm"
                    >
                      Validate All
                    </Button>
                  </div>
                </ModalHeader>

                <ModalBody>{renderOverviewContent()}</ModalBody>

                <ModalFooter>
                  <Button
                    color="default"
                    variant="flat"
                    onPress={onClose}
                    className="rounded-xl font-medium"
                  >
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default OverviewContainer;

const LoadingSkeleton = () => {
  const statsCardClass =
    "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900";
  return (
    <div className="OverviewContainer w-full h-fit px-4 md:px-8 py-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-11 w-56 rounded-xl" />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card
            key={`stats-loading-${idx}`}
            className={statsCardClass}
            shadow="sm"
          >
            <CardBody className="gap-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, sectionIdx) => (
          <Card
            key={`issue-loading-${sectionIdx}`}
            className="rounded-xl border border-gray-200 dark:border-gray-700"
            shadow="sm"
          >
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              {Array.from({ length: 4 }).map((__, itemIdx) => (
                <Skeleton
                  key={`issue-loading-item-${sectionIdx}-${itemIdx}`}
                  className="h-14 w-full rounded-lg"
                />
              ))}
            </CardBody>
          </Card>
        ))}
      </div>

      <Card
        className="rounded-xl border border-gray-200 dark:border-gray-700"
        shadow="sm"
      >
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton
                key={`question-loading-${idx}`}
                className="h-20 w-full rounded-lg"
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
