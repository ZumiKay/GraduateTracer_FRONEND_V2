import { Button, Switch, Tab, Tabs } from "@nextui-org/react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ReactNode, useEffect, useState } from "react";
import Selection, {
  ColorSelection,
} from "../component/FormComponent/Selection";
import { SelectionType } from "../types/Global.types";
import {
  DefaultFormSetting,
  FormDataType,
  FormSettingType,
  FormTypeEnum,
  returnscore,
} from "../types/Form.types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
  AsyncSaveForm,
  setallquestion,
  setfetchloading,
  setformstate,
  setprevallquestion,
  setreloaddata,
} from "../redux/formstore";
import { setopenmodal } from "../redux/openmodal";
import ApiRequest from "../hooks/ApiHook";
import { ErrorToast } from "../component/Modal/AlertModal";
import { hasObjectChanged } from "../helperFunc";
import Solution_Tab from "../component/FormComponent/Solution/Solution_Tab";
import QuestionTab from "../component/FormComponent/Question/Question_Tab";

type alltabs = "question" | "solution" | "response" | "setting";
export default function FormPage() {
  const param = useParams();
  const dispatch = useDispatch();
  const { formstate, reloaddata, page } = useSelector(
    (root: RootState) => root.allform
  );
  const navigate = useNavigate();
  const [searchParam, setsearchParam] = useSearchParams();

  useEffect(() => {
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const AsyncGetForm = async () => {
      //Validate Page Param

      dispatch(setfetchloading(true));

      const response = await ApiRequest({
        method: "GET",
        url: `/filteredform?ty=detail&q=${param?.id}&page=${page}`,
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
  }, [param.id, reloaddata, dispatch, page]);

  const handleTabs = (tab: alltabs) => {
    setsearchParam({ tab });
  };

  return (
    <div className="formpage w-full min-h-screen h-full">
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

const Settingitem = ({
  content,
  action,
}: {
  content: string;
  action?: ReactNode;
}) => {
  return (
    <div className="w-full h-fit flex flex-row items-center justify-between p-2 border-b-2 border-b-gray-300">
      <p className="text-lg font-normal">{content}</p>
      {action}
    </div>
  );
};

const ReturnScoreOption: Array<SelectionType<string>> = [
  { label: "Partial", value: returnscore.partial },
  { label: "Manual", value: returnscore.manual },
];
type SettingOptionType = Array<
  | {
      label: string;
      type: string;
      state: string;
      section: string;
      option?: Array<SelectionType<string>>;
    }
  | undefined
>;

const SettingOptions = (formtype: FormTypeEnum): SettingOptionType =>
  [
    {
      label: "Form Type",
      type: "select",
      state: "type",
      section: "General",
      option: FormTypeOptions,
    },

    {
      label: "Question Color",
      type: "color",
      state: "qcolor",
      section: "Customize",
    },
    { label: "Text Color", type: "color", state: "text", section: "Customize" },
    {
      label: "Background Color",
      type: "color",
      state: "bg",
      section: "Customize",
    },
    {
      label: "Limit to one reponse",
      type: "switch",
      state: "submitonce",
      section: "General",
    },
    {
      label: "Email Required",
      type: "switch",
      state: "email",
      section: "General",
    },
    {
      label: "Auto Save",
      type: "switch",
      state: "autosave",
      section: "General",
    },
    formtype === FormTypeEnum.Quiz
      ? {
          label: "Return Score",
          type: "select",
          state: "returnscore",
          section: "General",
          option: ReturnScoreOption,
        }
      : undefined,
  ].filter(Boolean);

const FormTypeOptions: Array<SelectionType<FormTypeEnum>> = [
  {
    label: "Normal",
    value: FormTypeEnum.Normal,
  },
  { label: "Quiz", value: FormTypeEnum.Quiz },
];

const SettingTab = () => {
  const { formstate, loading } = useSelector((root: RootState) => root.allform);
  const dispatch = useDispatch();
  const [isEdit, setisEdit] = useState(false);

  const handleRestoreSetting = async () => {
    dispatch(
      setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: {
            onAgree: () =>
              dispatch(
                AsyncSaveForm({
                  type: "edit",
                  data: { setting: DefaultFormSetting, _id: formstate._id },
                  onSuccess: () =>
                    dispatch(
                      setformstate({
                        ...formstate,
                        setting: DefaultFormSetting,
                      })
                    ),
                }) as never
              ),
          },
        },
      })
    );
  };

  const handleIsSaved = (newValue: Partial<FormSettingType>) => {
    const prevValue = { ...formstate.setting };

    const isChange = hasObjectChanged(prevValue, newValue);

    setisEdit(isChange);
  };

  const handleChangeSetting = (newVal: Partial<FormSettingType>) => {
    dispatch(
      setformstate({
        ...formstate,
        setting: {
          ...formstate.setting,
          ...newVal,
        },
      })
    );
    handleIsSaved(newVal);
  };

  const groupedOptions = SettingOptions(formstate.type as FormTypeEnum).reduce(
    (acc, option) => {
      const section = option?.section ?? "Misc"; // Default section if missing
      if (!acc[section]) acc[section] = [] as never;
      const otheracc = acc[section] as unknown as Array<object>;
      otheracc.push(option as never);
      return acc;
    },
    {} as Record<string, typeof SettingOptions>
  );

  const handleDeleteForm = () => {
    dispatch(
      setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: {
            onAgree: async () => {
              alert("Delete Form");
            },
          },
        },
      })
    );
  };

  return (
    <div className="setting-tab w-[80%] h-fit flex flex-col items-center gap-y-10 bg-white p-2 rounded-lg">
      <span className="text-red-300">
        {"when customize color please make sure all content are visible"}
      </span>
      {Object.entries(groupedOptions).map(([section, item]) => (
        <>
          <p key={section} className="text-4xl font-bold text-left w-full">
            {section}
          </p>

          {(item as unknown as SettingOptionType).map(
            (setting, idx) =>
              setting && (
                <Settingitem
                  key={idx}
                  content={setting.label ?? ""}
                  action={
                    setting.type === "color" ? (
                      <ColorSelection
                        value={
                          formstate.setting &&
                          formstate.setting[setting.state as never]
                        }
                        onChange={(val) => {
                          handleChangeSetting({
                            [setting.state]: val,
                          });
                        }}
                      />
                    ) : setting.type === "select" ? (
                      <Selection
                        className="w-[100px]"
                        items={setting.option ?? []}
                        selectedKeys={[formstate[setting.state as never]]}
                        onChange={(val) =>
                          dispatch(
                            setformstate({
                              ...formstate,
                              [setting.state as never]: val.target.value,
                            } as never)
                          ) as never
                        }
                      />
                    ) : setting.type === "switch" ? (
                      <>
                        <Switch
                          onValueChange={(val) =>
                            handleChangeSetting({ [setting.state]: val })
                          }
                          aria-label={setting.label}
                          {...(formstate.setting
                            ? {
                                isSelected:
                                  formstate.setting[setting.state as never],
                              }
                            : {})}
                        />
                      </>
                    ) : (
                      <></>
                    )
                  }
                />
              )
          )}
        </>
      ))}

      <div className="dangerous w-full h-full flex flex-row items-center justify-between">
        <p className="text-lg font-bold">Deletion</p>
        <Button
          color="danger"
          variant="bordered"
          className="font-bold max-w-sm"
          onPress={() => handleDeleteForm()}
        >
          Delete
        </Button>
      </div>

      <div className="btn_section w-full h-[40px] flex flex-row items-center gap-x-5">
        <Button
          isLoading={loading}
          onPress={() => handleRestoreSetting()}
          className="bg-slate-400 text-white font-bold"
        >
          Restore
        </Button>
        <Button
          isLoading={loading}
          color="success"
          isDisabled={!isEdit}
          onPress={() =>
            dispatch(
              AsyncSaveForm({
                type: "edit",
                data: { setting: formstate.setting, _id: formstate._id },
                onSuccess: () => setisEdit(false),
              }) as never
            )
          }
          className="text-white font-bold"
        >
          Save
        </Button>
      </div>
    </div>
  );
};
