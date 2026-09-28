import { Button, Tab, Tabs } from "@heroui/react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FormDataType,
  FormTypeEnum,
  ErrorValidataionPropsType,
  QuestionValidationIssue,
  ValidationResult,
} from "../types/Form.types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
  setallquestion,
  setfetchloading,
  setformstate,
  setpage,
  setprevallquestion,
  setreloaddata,
} from "../redux/formstore";
import { ErrorToast } from "../component/Modal/AlertModal";
import Solution_Tab from "../component/FormComponent/Solution/Solution_Tab";
import QuestionTab from "../component/FormComponent/Question/Question_Tab";
import SettingTab from "../component/FormComponent/Setting/Setting_Tab";
import PreviewTab from "../component/FormComponent/Preview/PreviewTab";
import ResponseDashboard from "../component/Response/ResponseDashboard";
import ResponseAnalytics from "../component/Response/ResponseAnalytics";
import { setopenmodal } from "../redux/openmodal";
import { useSetSearchParam } from "../hooks/CustomHook";
import { useQuery } from "@tanstack/react-query";
import Pagination from "../component/Navigator/PaginationComponent";
import { useFormAPI } from "../hooks/useFormAPI";
import useUserSession from "../hooks/useUserSession";
import OverviewContainer from "../component/FormComponent/Overview/component";

export type alltabs = "question" | "solution" | "preview" | "response" | "analytics" | "setting";

export const FORM_TABS: alltabs[] = [
  "question",
  "solution",
  "preview",
  "response",
  "analytics",
  "setting",
];

interface ApiError extends Error {
  status?: number;
  response?: {
    status?: number;
    data?: unknown;
  };
}

function extractQuestionValidationIssues(
  validationResults?: ValidationResult,
): Map<string, QuestionValidationIssue[]> {
  const map = new Map<string, QuestionValidationIssue[]>();
  if (!validationResults) return map;

  const getIssueMessage = (item: ErrorValidataionPropsType, fallback: string): string => {
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
      addIssue(item, "error", getIssueMessage(item, `Validation error on ${item.questionId}`));
    }
  });

  validationResults.warnings?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "warning", getIssueMessage(item, `Warning on ${item.questionId}`));
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

function FormPage() {
  const param = useParams();
  const dispatch = useDispatch();
  const userSession = useUserSession();
  const { fetchFormTab } = useFormAPI();
  const { formstate, page, allquestion } = useSelector((root: RootState) => root.allform);
  const navigate = useNavigate();
  const { searchParam, setParams } = useSetSearchParam();
  const [tab, setTab] = useState<alltabs>((searchParam.get("tab") ?? "question") as alltabs);
  const [isSettingUnsaved, setIsSettingUnsaved] = useState(false);

  const formId = useMemo(() => {
    return param.id || formstate._id || "";
  }, [param.id, formstate._id]);

  const { data, isSuccess, error, isError, isFetching } = useQuery({
    queryKey: ["FormInfo", formId, page, tab],
    queryFn: () => fetchFormTab({ tab, page, formId }),
    enabled: (!!formId || !!userSession.error) && tab !== "preview",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: (failureCount, error: Error) => {
      // Don't retry on 403/404 errors
      const apiError = error as ApiError;
      if (apiError?.status === 403 || apiError?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const isUnSavedQuestion = useMemo(() => allquestion.some((i) => !i._id), [allquestion]);

  //Initiallize Page
  useEffect(() => {
    const currentPage = searchParam.get("page");
    if (currentPage) {
      dispatch(setpage(Number(currentPage)));
    }
  }, [dispatch, searchParam]);

  useEffect(() => {
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (isSuccess && data.data) {
      const result = data.data as FormDataType;

      const hasAccess = result.isOwner || result.isCreator || result.isEditor;

      //Access Verification
      if (
        result.isOwner === undefined &&
        result.isCreator === undefined &&
        result.isEditor === undefined
      ) {
        ErrorToast({
          toastid: "FormAccess",
          title: "Access Denied",
          content: "Unable to verify form access permissions",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      if (!hasAccess) {
        ErrorToast({
          toastid: "FormAccess",
          title: "Access Denied",
          content: "You don't have permission to access this form",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      const currentTab = searchParam.get("tab") ?? "question";
      const isResultQuiz =
        result.type === FormTypeEnum.Quiz || String(result.type).toUpperCase() === "QUIZ";
      const shouldUpdateQuestions =
        currentTab === "question" || (isResultQuiz && currentTab === "solution");

      dispatch(
        setformstate({
          ...result,
          contents: undefined,
          validation: result.validation,
        }),
      );

      // Update questions only for question/solution tabs
      if (shouldUpdateQuestions && result.contents) {
        const currentPage = Number(searchParam.get("page") ?? 1);

        // Extract per-question validation issues from combined validation
        const validationMap = extractQuestionValidationIssues(result.validation?.validationResults);

        const normalizedContents = (result.contents ?? []).map((q) => {
          const key = q._id || String(q.qIdx);
          return {
            ...q,
            page: q.page ?? currentPage,
            isChildVisibility: q.conditional && q.conditional.length > 0 ? true : undefined,
            isVisible: q.parentcontent ? true : undefined,
            validationIssues: validationMap.get(key) ?? [],
          };
        });

        //Check for unsavedquestion

        dispatch(setallquestion(normalizedContents));
        dispatch(setprevallquestion(normalizedContents));
      }

      dispatch(setfetchloading(false));
    }

    // Handle errors
    if (isError && error) {
      const apiError = error as ApiError;

      if (apiError?.status === 403) {
        ErrorToast({
          toastid: "FormAccess",
          title: "Access Denied",
          content: "You don't have permission to access this form",
        });
      } else if (apiError?.status === 404) {
        ErrorToast({
          toastid: "UniqueForm",
          title: "Not Found",
          content: "Form Not Found",
        });
      } else {
        ErrorToast({
          toastid: "FormError",
          title: "Error",
          content: "Failed to load form",
        });
      }

      navigate("/dashboard", { replace: true });
    }
  }, [data, isFetching, param.id, error, navigate, dispatch, isError, searchParam, isSuccess]);

  const isQuiz = useMemo(
    () => formstate.type === FormTypeEnum.Quiz || String(formstate.type).toUpperCase() === "QUIZ",
    [formstate.type],
  );

  const availableTabs = useMemo<alltabs[]>(() => {
    if (isQuiz) {
      return ["question", "solution", "preview", "response", "analytics", "setting"];
    }
    return ["question", "preview", "response", "analytics", "setting"];
  }, [isQuiz]);

  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);

  const handleTabs = useCallback(
    async (val: alltabs) => {
      const currentIndex = availableTabs.indexOf(tab);
      const targetIndex = availableTabs.indexOf(val);
      if (targetIndex !== -1 && currentIndex !== -1) {
        setSwipeDirection(targetIndex >= currentIndex ? 1 : -1);
      }

      const proceedFunc = () => {
        setParams({ tab: val, page: "1" });
        setTab(val);
        dispatch(setfetchloading(true));
        dispatch(setpage(1));
        dispatch(setreloaddata(true));
      };

      if (tab === "setting" && isSettingUnsaved) {
        dispatch(
          setopenmodal({
            state: "confirm",
            value: {
              open: true,
              data: {
                question:
                  "You have unsaved settings. Are you sure you want to leave without saving?",
                btn: { agree: "Leave", disagree: "Stay" },
                onAgree: () => proceedFunc(),
              },
            },
          }),
        );
        return;
      }

      proceedFunc();
    },
    [tab, availableTabs, isSettingUnsaved, dispatch, setParams],
  );

  // Redirect away from solution tab if form is normal (not a quiz)
  useEffect(() => {
    if (formstate.type && !isQuiz && tab === "solution") {
      handleTabs("question");
    }
  }, [formstate.type, isQuiz, tab, handleTabs]);

  const handleSwipeNext = useCallback(() => {
    const currentIndex = availableTabs.indexOf(tab);
    if (currentIndex >= 0 && currentIndex < availableTabs.length - 1) {
      setSwipeDirection(1);
      handleTabs(availableTabs[currentIndex + 1]);
    }
  }, [tab, availableTabs, handleTabs]);

  const handleSwipePrev = useCallback(() => {
    const currentIndex = availableTabs.indexOf(tab);
    if (currentIndex > 0) {
      setSwipeDirection(-1);
      handleTabs(availableTabs[currentIndex - 1]);
    }
  }, [tab, availableTabs, handleTabs]);

  // Touch handlers for swipe tab changing on mobile/tablet
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isIgnoredTouchRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;

    if (e.touches.length > 1) {
      isIgnoredTouchRef.current = true;
      return;
    }

    const touch = e.touches[0];
    const target = e.target as HTMLElement | null;

    if (!target) {
      isIgnoredTouchRef.current = true;
      return;
    }

    // Ignore touches on interactive or horizontally scrollable elements
    const isInteractive = target.closest(
      [
        '[role="tablist"]',
        "input",
        "textarea",
        "select",
        "button",
        '[contenteditable="true"]',
        ".tiptap",
        '[role="slider"]',
        '[role="dialog"]',
        '[role="listbox"]',
        ".no-scrollbar",
        ".overflow-x-auto",
        ".QuestionStructure",
        "[data-prevent-swipe]",
      ].join(", "),
    );

    if (isInteractive) {
      isIgnoredTouchRef.current = true;
      return;
    }

    isIgnoredTouchRef.current = false;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (isIgnoredTouchRef.current || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;

      // Swipe criteria:
      // 1. Gesture finished within 500ms
      // 2. Traveled at least 50px horizontally
      // 3. Horizontal intent dominates vertical scrolling (|deltaX| > |deltaY| * 1.5)
      if (elapsed <= 500 && Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          handleSwipeNext();
        } else {
          handleSwipePrev();
        }
      }
    },
    [handleSwipeNext, handleSwipePrev],
  );

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
    isIgnoredTouchRef.current = true;
  }, []);

  // Auto-scroll active tab into view in horizontal tab bar on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeTabEl = document.querySelector<HTMLElement>(`[role="tab"][data-key="${tab}"]`);
      if (activeTabEl) {
        activeTabEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [tab]);

  const handlePageChange = useCallback(
    (val: number) => {
      setParams({ page: val.toString() });
      dispatch(setfetchloading(true));
      dispatch(setpage(val));
      dispatch(setreloaddata(true));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [dispatch, setParams],
  );

  const handlePage = useCallback(
    (val: number) => {
      // Check for unsaved questions before navigating

      if (isUnSavedQuestion) {
        //Block page
        dispatch(setpage(page));
        dispatch(
          setopenmodal({
            state: "confirm",
            value: {
              open: true,
              data: {
                question:
                  "You have unsaved questions on this page. Are you sure you want to go back without saving?",
                btn: {
                  agree: "Proceed",
                  disagree: "Close",
                },
                onAgree: () => {
                  // If user confirms, proceed with backward navigation
                  handlePageChange(val);
                },
              },
            },
          }),
        );

        return;
      }

      handlePageChange(val);
    },
    [isUnSavedQuestion, handlePageChange, dispatch, page],
  );

  const selectedKey = useMemo(() => searchParam.get("tab") ?? "question", [searchParam]);

  // Tab animation variants with directional slide
  const tabVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 25 : -25,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -25 : 25,
      transition: {
        duration: 0.2,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    }),
  };

  // Sync document title
  useEffect(() => {
    if (formstate.title) {
      document.title = `${formstate.title} | ${tab.toUpperCase()}`;
    }
  }, [formstate.title, tab]);

  return (
    <div
      className="formpage relative w-full min-h-screen h-full pb-5"
      style={formstate.setting?.bg ? { backgroundColor: formstate.setting.bg } : undefined}
    >
      <title>{`${formstate.title} | ${tab.toUpperCase()}`}</title>

      {/* Top action header bar */}
      <div className="w-full flex items-center justify-between px-2.5 sm:px-6 py-1 sm:py-2 border-b border-gray-100 dark:border-gray-800/60 bg-white/50 dark:bg-black/50 backdrop-blur-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[11px] sm:text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize">
            {tab} Mode
          </span>
          <span className="sm:hidden text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            ({availableTabs.indexOf(tab) + 1}/{availableTabs.length} · Swipe)
          </span>
          {formstate.totalQuestions !== undefined &&
            (tab === "question" || (isQuiz && tab === "solution")) && (
              <span className="hidden sm:inline-flex text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                {formstate.totalQuestions}{" "}
                {formstate.totalQuestions === 1 ? "question" : "questions"}
              </span>
            )}
        </div>

        {tab !== "preview" && (
          <Button
            variant="solid"
            size="sm"
            color="primary"
            startContent={<EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
            onPress={() => handleTabs("preview")}
            className="font-semibold text-[11px] sm:text-sm h-6 sm:h-8 px-2 sm:px-3 rounded-md sm:rounded-lg"
          >
            Preview
          </Button>
        )}
      </div>

      <div
        className="w-full flex-1 flex flex-col touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <Tabs
          className="w-full h-fit bg-white dark:bg-black"
          variant="underlined"
          selectedKey={selectedKey}

          onSelectionChange={(val) => handleTabs(val as alltabs)}
        >
          <Tab key={"question"} title="Question">
            <AnimatePresence mode="wait" custom={swipeDirection}>
              <motion.div
                key="question-tab"
                custom={swipeDirection}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative w-full"
              >
                <OverviewContainer tab="question" loading={isFetching} />
                <QuestionTab />
              </motion.div>
            </AnimatePresence>
          </Tab>
          {isQuiz && (
            <Tab key={"solution"} title="Solution">
              <AnimatePresence mode="wait" custom={swipeDirection}>
                <motion.div
                  key="solution-tab"
                  custom={swipeDirection}
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="relative w-full"
                >
                  <OverviewContainer tab="solution" loading={isFetching} />
                  <Solution_Tab isLoading={isFetching} />
                </motion.div>
              </AnimatePresence>
            </Tab>
          )}
          <Tab
            key={"preview"}
            title={
              <div className="flex items-center gap-1 sm:gap-1.5">
                <EyeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Preview</span>
              </div>
            }
          >
            <AnimatePresence mode="wait" custom={swipeDirection}>
              <motion.div
                key="preview-tab"
                custom={swipeDirection}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {formId ? (
                  <PreviewTab formId={formId} />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center">
                    <p className="text-gray-500">Loading preview...</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tab>
          <Tab key={"response"} title="Response">
            <AnimatePresence mode="wait" custom={swipeDirection}>
              <motion.div
                key="response-tab"
                custom={swipeDirection}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {formId ? (
                  <ResponseDashboard formId={formId} form={formstate} />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center">
                    <p className="text-gray-500">Loading form data...</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tab>
          <Tab key={"analytics"} title="Analytics">
            <AnimatePresence mode="wait" custom={swipeDirection}>
              <motion.div
                key="analytics-tab"
                custom={swipeDirection}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {formId ? (
                  <ResponseAnalytics formId={formId} form={formstate} />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center">
                    <p className="text-gray-500">Loading form data...</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tab>
          <Tab
            key={"setting"}
            title={
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span>Setting</span>
                {isSettingUnsaved && (
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-400 inline-block" />
                )}
              </div>
            }
          >
            <AnimatePresence mode="wait" custom={swipeDirection}>
              <motion.div
                key="setting-tab"
                custom={swipeDirection}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full py-4 px-2 sm:px-4 flex justify-center"
              >
                <SettingTab onUnsavedChange={setIsSettingUnsaved} />
              </motion.div>
            </AnimatePresence>
          </Tab>
        </Tabs>
      </div>

      {/* Pagination */}
      {(tab === "question" || (isQuiz && tab === "solution")) && (formstate.totalpage ?? 0) > 1 ? (
        <div className="sticky bottom-0 w-full h-fit py-2.5 sm:py-3 px-2 flex justify-center items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.06)]">
          <Pagination page={page} setPage={handlePage} totalPage={formstate.totalpage} />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

FormPage.displayName = "FormPage";

export default FormPage;
