import { Pagination, Tab, Tabs } from "@heroui/react";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback, useMemo, memo } from "react";

import { FormDataType } from "../types/Form.types";
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
import ApiRequest from "../hooks/ApiHook";
import { ErrorToast } from "../component/Modal/AlertModal";
import Solution_Tab from "../component/FormComponent/Solution/Solution_Tab";
import QuestionTab from "../component/FormComponent/Question/Question_Tab";
import SettingTab from "../component/FormComponent/Setting/Setting_Tab";
import ResponseDashboard from "../component/Response/ResponseDashboard";
import ResponseAnalytics from "../component/Response/ResponseAnalytics";
import { setopenmodal } from "../redux/openmodal";
import { useSetSearchParam } from "../hooks/CustomHook";
import useFormValidation from "../hooks/ValidationHook";
import ImprovedAutoSave from "../component/AutoSave/ImprovedAutoSave";
import { useQuery } from "@tanstack/react-query";
import { checkUnsavedQuestions } from "../utils/formValidation";

type alltabs =
  | "question"
  | "solution"
  | "preview"
  | "response"
  | "analytics"
  | "setting";

// Define error type for React Query
interface ApiError extends Error {
  status?: number;
  response?: {
    status?: number;
    data?: unknown;
  };
}

//Fetch Function

const fetchFormTab = async ({
  tab,
  page,
  formId,
}: {
  tab: alltabs;
  page: number;
  formId: string;
}) => {
  const ty = tab === "question" ? "detail" : tab;

  const response = await ApiRequest({
    url: `/filteredform?ty=${ty}&q=${formId}&page=${page}`,
    method: "GET",
    cookie: true,
    refreshtoken: true,
    reactQuery: true,
  });

  return response.data as FormDataType;
};

function FormPage() {
  const param = useParams();
  const dispatch = useDispatch();
  const { formstate, reloaddata, page, allquestion, prevAllQuestion } =
    useSelector((root: RootState) => root.allform);
  const navigate = useNavigate();
  const { validateForm, showValidationWarnings } = useFormValidation();

  const { searchParam, setParams } = useSetSearchParam();
  const [tab, setTab] = useState<alltabs>(
    (searchParam.get("tab") ?? "question") as alltabs
  );

  // Compute reliable form ID
  const formId = useMemo(() => {
    return param.id || formstate._id || "";
  }, [param.id, formstate._id]);

  const { data, error, isLoading, isFetching } = useQuery({
    // Remove reloaddata from the key to avoid accidental refetches on local state changes
    queryKey: ["FormInfo", formId, page, tab],
    queryFn: () => fetchFormTab({ tab, page, formId }),
    // Do not use placeholder data to ensure we only apply fresh server data when reloading

    // Keep data fresh for a bit while editing; increase if needed
    staleTime: 30000,
    // Only fetch when explicitly requested via reloaddata and allowed tabs
    enabled:
      !!formId && reloaddata && tab !== "analytics" && tab !== "response",
    refetchOnWindowFocus: false, // Prevent window refetches
    refetchOnReconnect: false, // Prevent reconnect refetches
    refetchOnMount: false,
    retry: (failureCount, error: Error) => {
      // Don't retry on 403/404 errors
      const apiError = error as ApiError;
      if (apiError?.status === 403 || apiError?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle success and error in a single optimized useEffect
  useEffect(() => {
    // Handle loading state (treat background fetch as loading to reflect UI intent)
    dispatch(setfetchloading(isLoading || isFetching));

    // Handle initial navigation check
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Handle success for any fresh data
    if (data && !error) {
      const result = data as FormDataType;

      // Double-check access on frontend
      const hasAccess = result.isOwner || result.isCollaborator;

      if (result.isOwner === undefined && result.isCollaborator === undefined) {
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

      // Only write new data when reload was explicitly requested
      if (reloaddata) {
        // Normalize contents to ensure each question has a valid page set
        const normalizedContents = (result.contents ?? []).map((q) => ({
          ...q,
          page: q.page ?? page, // default to current page if missing
        }));
        console.log("Set new data");

        // Set form content - preserve existing totalscore when updating
        dispatch(
          setformstate({
            ...result,
            contents: undefined, // Remove contents to avoid duplication
            totalscore: result.totalscore ?? formstate.totalscore, // Preserve existing totalscore if not in server data
          })
        );
        dispatch(setallquestion(normalizedContents));
        dispatch(setprevallquestion(normalizedContents));

        // Reset reload flag and clear loading after successful write
        dispatch(setreloaddata(false));
        dispatch(setfetchloading(false));
      }

      // Skip any additional refetch-triggered side-effects
    }

    // Handle errors
    if (error && !isLoading) {
      console.error("React Query error:", error);

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
          content: apiError?.message || "Failed to load form",
        });
      }

      navigate("/dashboard", { replace: true });
    }
  }, [
    data,
    isLoading,
    isFetching,
    param.id,
    reloaddata,
    error,
    navigate,
    page,
    formstate.totalscore,
    dispatch,
  ]);

  const continueTabSwitching = useCallback(
    async (val: alltabs, proceedFunc: () => void) => {
      // Validate before switching to solution tab
      if (val === "solution" && formId) {
        try {
          const validation = await validateForm(formId, "switch_tab");
          if (
            validation &&
            validation.warnings &&
            validation.warnings.length > 0
          ) {
            showValidationWarnings(validation);
          }
        } catch (error) {
          console.error("Validation error:", error);
        }
      }

      // Note: Removed required question validation for admin interface
      // Required validation should only apply to respondent forms, not admin form builder
      proceedFunc();
    },
    [formId, validateForm, showValidationWarnings]
  );

  const handleTabs = useCallback(
    async (val: alltabs) => {
      const proceedFunc = () => {
        setParams({ tab: val, page: "1" });
        setTab(val);
        dispatch(setfetchloading(true));
        dispatch(setpage(1));
        dispatch(setreloaddata(true));
      };

      // Note: Removed unsaved questions check when switching tabs
      // The Question Tab component handles its own navigation protection
      // Tab switching should not be blocked by unsaved questions
      continueTabSwitching(val, proceedFunc);
    },
    [continueTabSwitching, setParams, dispatch]
  );

  const handlePage = useCallback(
    (val: number) => {
      // Check for unsaved questions before navigating
      if (checkUnsavedQuestions(allquestion, prevAllQuestion, page)) {
        dispatch(
          setopenmodal({
            state: "confirm",
            value: {
              open: true,
              data: {
                question:
                  "You have unsaved questions on this page. Please save them before navigating to another page.",
                onAgree: () => {
                  // If user confirms, proceed with navigation
                  setParams({ page: val.toString() });
                  dispatch(setfetchloading(true));
                  dispatch(setpage(val));
                  dispatch(setreloaddata(true));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                },
              },
            },
          })
        );

        return;
      }

      // If no unsaved questions, proceed normally
      setParams({ page: val.toString() });
      dispatch(setfetchloading(true));
      // Set the page first so the next fetch runs with the latest page
      dispatch(setpage(val));
      // Then enable reload to trigger the fetch for the new page
      dispatch(setreloaddata(true));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setParams, dispatch, allquestion, prevAllQuestion, page]
  );

  const selectedKey = useMemo(
    () => searchParam.get("tab") ?? "question",
    [searchParam]
  );

  return (
    <div
      className={`formpage w-full min-h-screen h-full pb-5 ${
        formstate.setting?.bg ? `bg-[${formstate.setting.bg}]` : ""
      }`}
    >
      <Tabs
        className="w-full h-fit bg-white"
        variant="underlined"
        selectedKey={selectedKey}
        onSelectionChange={(val) => handleTabs(val as alltabs)}
      >
        <Tab key={"question"} title="Question">
          <div className="relative">
            <QuestionTab />
            <ImprovedAutoSave />
          </div>
        </Tab>
        <Tab key={"solution"} title="Solution">
          <Solution_Tab />
        </Tab>
        <Tab key={"response"} title="Response">
          {formId ? (
            <ResponseDashboard formId={formId} form={formstate} />
          ) : (
            <div className="w-full h-40 flex items-center justify-center">
              <p className="text-gray-500">Loading form data...</p>
            </div>
          )}
        </Tab>
        <Tab key={"analytics"} title="Analytics">
          {formId ? (
            <ResponseAnalytics formId={formId} form={formstate} />
          ) : (
            <div className="w-full h-40 flex items-center justify-center">
              <p className="text-gray-500">Loading form data...</p>
            </div>
          )}
        </Tab>
        <Tab key={"setting"} title="Setting">
          <div className="w-full min-h-screen h-full grid place-items-center">
            <SettingTab />
          </div>
        </Tab>
      </Tabs>

      {/* Pagination */}

      {tab !== "analytics" && tab !== "setting" ? (
        <div className="w-full h-fit grid place-content-center">
          <Pagination
            loop
            showControls
            className="bg-white rounded-xl"
            color="default"
            initialPage={1}
            total={formstate.totalpage ?? 0}
            page={page}
            onChange={handlePage}
          />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

FormPage.displayName = "FormPage";

export default memo(FormPage);
