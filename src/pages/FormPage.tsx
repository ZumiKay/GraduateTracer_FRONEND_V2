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
import { setopenmodal } from "../redux/openmodal";
import { useSetSearchParam } from "../hooks/CustomHook";
import { useCallback, useMemo } from "react";
import useFormValidation from "../hooks/ValidationHook";

type alltabs = "question" | "solution" | "preview" | "response" | "setting";

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

    const response = await ApiRequest({
      method: "GET",
      url: `/filteredform?ty=${ty}&q=${param?.id}&page=${page}`,
      refreshtoken: true,
      cookie: true,
    });

    dispatch(setfetchloading(false));
    dispatch(setreloaddata(false));

    if (!response.success) {
      ErrorToast({
        toastid: "UniqueForm",
        title: "Not Found",
        content: "Form Not Found",
      });
      navigate("/dashboard", { replace: true });
      return;
    }

    const result = response.data as unknown as FormDataType;

    //Set form content
    dispatch(setformstate({ ...formstate, ...result, contents: undefined }));
    dispatch(setallquestion(result.contents ?? []));

    //Track if the state change
    dispatch(setprevallquestion(result.contents ?? []));
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

  const handleTabs = useCallback(
    async (val: alltabs) => {
      const proceedFunc = () => {
        setParams({ tab: val });
        setTab(val);
        dispatch(setreloaddata(true));
      };

      // Validate before switching to solution tab
      if (val === "solution" && formstate._id) {
        try {
          const validation = await validateForm(formstate._id, "switch_tab");
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
      formstate._id,
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
          <QuestionTab />
        </Tab>
        <Tab key={"solution"} title="Solution">
          <Solution_Tab />
        </Tab>
        <Tab key={"response"} title="Response"></Tab>
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
