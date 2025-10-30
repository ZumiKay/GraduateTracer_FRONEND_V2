import { Tab, Tabs } from "@heroui/react";
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
import Pagination from "../component/Navigator/PaginationComponent";

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
    queryKey: ["FormInfo", formId, page, tab],
    queryFn: () => fetchFormTab({ tab, page, formId }),
    staleTime: 30000,
    enabled: !!formId && tab !== "analytics" && tab !== "response",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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

  const isUnSavedQuestion = useMemo(
    () => checkUnsavedQuestions(allquestion, prevAllQuestion, page),
    [allquestion, page, prevAllQuestion]
  );

  //Initiallize Page
  useEffect(() => {
    const currentPage = searchParam.get("page");
    if (currentPage) {
      dispatch(setpage(Number(currentPage)));
    }
  }, [dispatch, searchParam]);

  useEffect(() => {
    dispatch(setfetchloading(isLoading || isFetching));

    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (data && !error) {
      const result = data as FormDataType;

      const hasAccess = result.isOwner || result.isCreator || result.isEditor;

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

      if (reloaddata) {
        const normalizedContents = (result.contents ?? []).map((q) => ({
          ...q,
          page: q.page ?? page,
        }));

        dispatch(
          setformstate({
            ...result,
            contents: undefined,
            totalscore: result.totalscore ?? formstate.totalscore,
          })
        );
        dispatch(setallquestion(normalizedContents));
        dispatch(setprevallquestion(normalizedContents));
        dispatch(setreloaddata(false));
        dispatch(setfetchloading(false));
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

      continueTabSwitching(val, proceedFunc);
    },
    [continueTabSwitching, setParams, dispatch]
  );

  const handlePageChange = useCallback(
    (val: number) => {
      setParams({ page: val.toString() });
      dispatch(setfetchloading(true));
      dispatch(setpage(val));
      dispatch(setreloaddata(true));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [dispatch, setParams]
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
          })
        );

        return;
      }

      handlePageChange(val);
    },
    [isUnSavedQuestion, handlePageChange, dispatch, page]
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

      {tab === "question" || tab === "solution" || formstate.totalpage ? (
        <div className="w-full h-fit grid place-content-center">
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

export default memo(FormPage);
