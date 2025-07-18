import { Pagination, Tab, Tabs } from "@heroui/react";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";

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
import { useCallback, useMemo } from "react";
import useFormValidation from "../hooks/ValidationHook";
import ImprovedAutoSave from "../component/AutoSave/ImprovedAutoSave";

type alltabs =
  | "question"
  | "solution"
  | "preview"
  | "response"
  | "analytics"
  | "setting";

export default function FormPage() {
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

  const AsyncGetForm = useCallback(async () => {
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    dispatch(setfetchloading(true));

    const ty = tab === "question" ? "detail" : tab;

    try {
      const response = await ApiRequest({
        method: "GET",
        url: `/filteredform?ty=${ty}&q=${param?.id}&page=${page}`,
        refreshtoken: true,
        cookie: true,
      });

      if (!response.success) {
        dispatch(setfetchloading(false));
        dispatch(setreloaddata(false));

        // Handle different error cases
        if (response.status === 403) {
          ErrorToast({
            toastid: "FormAccess",
            title: "Access Denied",
            content: "You don't have permission to access this form",
          });
        } else if (response.status === 404) {
          ErrorToast({
            toastid: "UniqueForm",
            title: "Not Found",
            content: "Form Not Found",
          });
        } else {
          ErrorToast({
            toastid: "FormError",
            title: "Error",
            content: response.error || "Failed to load form",
          });
        }

        navigate("/dashboard", { replace: true });
        return;
      }

      const result = response.data as unknown as FormDataType;

      // Debug the response data
      console.log("Backend response data:", {
        formId: result._id,
        title: result.title,
        isOwner: result.isOwner,
        isCollaborator: result.isCollaborator,
        user: result.user,
        owners: result.owners,
      });

      // Double-check access on frontend (redundant but safer)
      const hasAccess = result.isOwner || result.isCollaborator;

      // If backend didn't set access flags, assume no access for security
      if (result.isOwner === undefined && result.isCollaborator === undefined) {
        console.warn(
          "Backend didn't provide access information, denying access"
        );
        ErrorToast({
          toastid: "FormAccess",
          title: "Access Denied",
          content: "Unable to verify form access permissions",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      if (!hasAccess) {
        console.log("Access denied - Form access check failed:", {
          isOwner: result.isOwner,
          isCollaborator: result.isCollaborator,
          hasAccess,
        });
        ErrorToast({
          toastid: "FormAccess",
          title: "Access Denied",
          content: "You don't have permission to access this form",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      // Set form content
      dispatch(setformstate({ ...formstate, ...result, contents: undefined }));
      dispatch(setallquestion(result.contents ?? []));

      // Track if the state change
      dispatch(setprevallquestion(result.contents ?? []));

      console.log("Form loaded successfully:", {
        formId: result._id,
        isOwner: result.isOwner,
        isCollaborator: result.isCollaborator,
        hasAccess,
      });
    } catch (error) {
      console.error("Error fetching form:", error);

      ErrorToast({
        toastid: "FormError",
        title: "Error",
        content: "Failed to load form data",
      });
      navigate("/dashboard", { replace: true });
    } finally {
      dispatch(setfetchloading(false));
      dispatch(setreloaddata(false));
    }
  }, [param.id, page, tab, navigate, formstate, dispatch]);

  useEffect(() => {
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (reloaddata) AsyncGetForm();
  }, [param.id, reloaddata, AsyncGetForm, navigate]);

  const isFillAllRequired = useMemo(
    () => allquestion.some((i) => (i.require ? i.answer && i.score : true)),
    [allquestion]
  );

  // Compute reliable form ID
  const formId = useMemo(() => {
    return param.id || formstate._id || "";
  }, [param.id, formstate._id]);

  const handleTabs = useCallback(
    async (val: alltabs) => {
      const proceedFunc = () => {
        setParams({ tab: val });
        setTab(val);
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

      if (!isFillAllRequired && tab === "solution") {
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
      tab,
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
      dispatch(setpage(val) as never);
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
          <ResponseDashboard formId={formId} form={formstate} />
        </Tab>
        <Tab key={"analytics"} title="Analytics">
          <ResponseAnalytics formId={formId} form={formstate} />
        </Tab>
        <Tab key={"setting"} title="Setting">
          <div className="w-full min-h-screen h-full grid place-items-center">
            <SettingTab />
          </div>
        </Tab>
      </Tabs>

      {/* Pagination */}
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
    </div>
  );
}
