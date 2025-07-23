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
import { keepPreviousData, useQuery } from "@tanstack/react-query";

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
  const { formstate, reloaddata, page, allquestion } = useSelector(
    (root: RootState) => root.allform
  );
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

  const { data, error, isLoading } = useQuery({
    queryKey: ["FormInfo", formId, page, tab, reloaddata], // Include reloaddata in key
    queryFn: () => fetchFormTab({ tab, page, formId }),
    placeholderData: keepPreviousData,
    staleTime: 5000,
    enabled: !!formId && tab !== "analytics" && tab !== "response", // Don't fetch for analytics and response tabs
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Prevent refetch on component mount
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
    // Handle loading state
    dispatch(setfetchloading(isLoading));

    // Handle initial navigation check
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Handle success
    if (data && !isLoading && !error) {
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

      // Set form content - avoid circular dependency by not spreading formstate
      dispatch(
        setformstate({
          ...result,
          contents: undefined, // Remove contents to avoid duplication
        })
      );
      dispatch(setallquestion(result.contents ?? []));
      dispatch(setprevallquestion(result.contents ?? []));

      // Reset reload flag after successful fetch
      if (reloaddata) {
        dispatch(setreloaddata(false));
      }
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

      if (reloaddata) {
        dispatch(setreloaddata(false));
      }
    }
  }, [data, error, isLoading, param.id, reloaddata, dispatch, navigate]);

  // Memoize required check for performance - Fixed logic
  const isFillAllRequired = useMemo(
    () =>
      allquestion.every((i) => {
        if (!i.require) return true; // Non-required questions are always "filled"
        if (!i.answer) return false; // Required question without answer

        // Check if answer has a value
        const answerValue = i.answer.answer;
        if (answerValue === undefined || answerValue === null) return false;

        // Handle different answer types
        if (typeof answerValue === "string") {
          return answerValue.trim() !== "";
        }
        if (Array.isArray(answerValue)) {
          return answerValue.length > 0;
        }

        return true; // For numbers, dates, etc.
      }),
    [allquestion]
  );

  const handleTabs = useCallback(
    async (val: alltabs) => {
      const proceedFunc = () => {
        setParams({ tab: val, page: "1" });
        setTab(val);
        dispatch(setpage(1));
        dispatch(setreloaddata(true));
      };

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

      if (!isFillAllRequired && val === "solution") {
        dispatch(
          setopenmodal({
            state: "confirm",
            value: {
              open: true,
              data: {
                question: "Missing Some Info on required question",
                onAgree: () => proceedFunc(),
                btn: {
                  agree: "Proceed",
                  disagree: "Back",
                },
              },
            },
          })
        );
      } else {
        proceedFunc();
      }
    },
    [
      isFillAllRequired,
      setParams,
      dispatch,
      formId,
      validateForm,
      showValidationWarnings,
    ]
  );

  const handlePage = useCallback(
    (val: number) => {
      setParams({ page: val.toString() });
      dispatch(setpage(val));
      dispatch(setreloaddata(true));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setParams, dispatch]
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

      {tab !== "analytics" && tab !== "setting" && (
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
      )}
    </div>
  );
}

FormPage.displayName = "FormPage";

export default memo(FormPage);
