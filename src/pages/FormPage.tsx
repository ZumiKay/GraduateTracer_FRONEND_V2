import { Tab, Tabs } from "@heroui/react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useEffect, useState } from "react";

import { FormDataType } from "../types/Form.types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
  setallquestion,
  setfetchloading,
  setformstate,
  setprevallquestion,
  setreloaddata,
} from "../redux/formstore";
import ApiRequest from "../hooks/ApiHook";
import { ErrorToast } from "../component/Modal/AlertModal";
import Solution_Tab from "../component/FormComponent/Solution/Solution_Tab";
import QuestionTab from "../component/FormComponent/Question/Question_Tab";
import SettingTab from "../component/FormComponent/Setting/Setting_Tab";

type alltabs = "question" | "solution" | "preview" | "response" | "setting";
export default function FormPage() {
  const param = useParams();
  const dispatch = useDispatch();
  const { formstate, reloaddata, page, isShowCond } = useSelector(
    (root: RootState) => root.allform
  );
  const navigate = useNavigate();
  const [searchParam, setsearchParam] = useSearchParams();
  const [tab, setTab] = useState<alltabs>(
    (searchParam.get("tab") ?? "question") as alltabs
  );

  useEffect(() => {
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const AsyncGetForm = async () => {
      //Validate Page Param

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
    };

    if (reloaddata) AsyncGetForm();
  }, [param.id, reloaddata, dispatch, page, tab, isShowCond]);

  const handleTabs = (tab: alltabs) => {
    setsearchParam({ tab });
    setTab(tab);
    setreloaddata(true);
  };

  return (
    <div
      style={{ backgroundColor: formstate.setting?.bg }}
      className="formpage w-full min-h-screen h-full"
    >
      <Tabs
        className="w-full h-fit bg-white"
        variant="underlined"
        selectedKey={searchParam.get("tab") ?? "question"}
        onSelectionChange={(val) => handleTabs(val as alltabs)}
      >
        <Tab key={"question"} title="Question">
          <div className="w-full min-h-screen h-full pt-5">
            <QuestionTab />
          </div>
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
    </div>
  );
}
