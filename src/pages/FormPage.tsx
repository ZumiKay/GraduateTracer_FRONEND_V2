import { Button, Tab, Tabs } from "@heroui/react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FormDataType,
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
import ResponseDashboard from "../component/Response/ResponseDashboard";
import ResponseAnalytics from "../component/Response/ResponseAnalytics";
import { setopenmodal } from "../redux/openmodal";
import { useSetSearchParam } from "../hooks/CustomHook";
import { useQuery } from "@tanstack/react-query";
import Pagination from "../component/Navigator/PaginationComponent";
import { useFormAPI } from "../hooks/useFormAPI";
import useUserSession from "../hooks/useUserSession";
import OverviewContainer from "../component/FormComponent/Overview/component";

export type alltabs =
  | "question"
  | "solution"
  | "preview"
  | "response"
  | "analytics"
  | "setting";

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

function FormPage() {
  const param = useParams();
  const dispatch = useDispatch();
  const userSession = useUserSession();
  const { fetchFormTab } = useFormAPI();
  const { formstate, page, allquestion } = useSelector(
    (root: RootState) => root.allform,
  );
  const navigate = useNavigate();
  const { searchParam, setParams } = useSetSearchParam();
  const [tab, setTab] = useState<alltabs>(
    (searchParam.get("tab") ?? "question") as alltabs,
  );
  const [isSettingUnsaved, setIsSettingUnsaved] = useState(false);

  const formId = useMemo(() => {
    return param.id || formstate._id || "";
  }, [param.id, formstate._id]);

  const { data, isSuccess, error, isError, isFetching } = useQuery({
    queryKey: ["FormInfo", formId, page, tab],
    queryFn: () => fetchFormTab({ tab, page, formId }),
    enabled: !!formId || !!userSession.error,
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

  const isUnSavedQuestion = useMemo(
    () => allquestion.some((i) => !i._id),
    [allquestion],
  );

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
      const shouldUpdateQuestions =
        currentTab === "question" || currentTab === "solution";

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
        const validationMap = extractQuestionValidationIssues(
          result.validation?.validationResults,
        );

        const normalizedContents = (result.contents ?? []).map((q) => {
          const key = q._id || String(q.qIdx);
          return {
            ...q,
            page: q.page ?? currentPage,
            isChildVisibility:
              q.conditional && q.conditional.length > 0 ? true : undefined,
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
  }, [
    data,
    isFetching,
    param.id,
    error,
    navigate,
    dispatch,
    isError,
    searchParam,
    isSuccess,
  ]);

  const handleTabs = async (val: alltabs) => {
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
  };

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
                  agree: "Prceed",
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

  const selectedKey = useMemo(
    () => searchParam.get("tab") ?? "question",
    [searchParam],
  );

  // Tab animation variants
  const tabVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <div
      className={`formpage relative w-full min-h-screen h-full pb-5 ${
        formstate.setting?.bg ? `bg-[${formstate.setting.bg}]` : ""
      }`}
    >
      <title>{`${formstate.title} | ${tab.toUpperCase()}`}</title>
      <Button
        className="ml-[90%] font-bold"
        variant="solid"
        size="md"
        color="secondary"
        startContent={<EyeIcon className="w-4 h-4" />}
      >
        Preview
      </Button>
      {(tab === "question" || tab === "solution") && (
        <OverviewContainer tab={tab} loading={isFetching} />
      )}

      <Tabs
        className="w-full h-fit bg-white dark:bg-black"
        variant="underlined"
        selectedKey={selectedKey}
        onSelectionChange={(val) => handleTabs(val as alltabs)}
      >
        <Tab key={"question"} title="Question">
          <AnimatePresence mode="wait">
            <motion.div
              key="question-tab"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative"
            >
              <QuestionTab />
            </motion.div>
          </AnimatePresence>
        </Tab>
        <Tab key={"solution"} title="Solution">
          <AnimatePresence mode="wait">
            <motion.div
              key="solution-tab"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Solution_Tab isLoading={isFetching} />
            </motion.div>
          </AnimatePresence>
        </Tab>
        <Tab key={"response"} title="Response">
          <AnimatePresence mode="wait">
            <motion.div
              key="response-tab"
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
          <AnimatePresence mode="wait">
            <motion.div
              key="analytics-tab"
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
            <div className="flex items-center gap-1.5">
              Setting
              {isSettingUnsaved && (
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              )}
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="setting-tab"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full min-h-screen h-full grid place-items-center"
            >
              <SettingTab onUnsavedChange={setIsSettingUnsaved} />
            </motion.div>
          </AnimatePresence>
        </Tab>
      </Tabs>

      {/* Pagination */}

      {(tab === "question" || tab === "solution") && formstate.totalpage ? (
        <div
          className={`w-full h-fit py-3 grid place-content-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}
        >
          <Pagination
            page={page}
            setPage={handlePage}
            totalPage={formstate.totalpage}
          />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

FormPage.displayName = "FormPage";

export default FormPage;
