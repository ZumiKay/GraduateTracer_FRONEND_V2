import {
  Button,
  Image,
  Pagination,
  Switch,
  Tab,
  Tabs,
} from "@nextui-org/react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { PlusIcon } from "../component/svg/GeneralIcon";
import QuestionComponent from "../component/FormComponent/QuestionComponent";
import { ReactNode, useEffect, useRef, useState } from "react";
import Selection, {
  ColorSelection,
} from "../component/FormComponent/Selection";
import { SelectionType } from "../types/Global.types";
import {
  ConditionalType,
  DefaultContentType,
  DefaultFormSetting,
  FormDataType,
  FormSettingType,
  FormTypeEnum,
  returnscore,
} from "../types/Form.types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setallquestion, setformstate } from "../redux/formstore";
import PlusImg from "../assets/add.png";
import MinusIcon from "../assets/minus.png";
import { setopenmodal } from "../redux/openmodal";
import ApiRequest from "../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import { hasObjectChanged } from "../helperFunc";

type alltabs = "question" | "solution" | "response" | "setting";
export default function FormPage() {
  const param = useParams();
  const dispatch = useDispatch();
  const formstate = useSelector((root: RootState) => root.allform.formstate);
  const navigate = useNavigate();
  const [searchParam, setsearchParam] = useSearchParams();

  useEffect(() => {
    if (!param.id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const AsyncGetForm = async () => {
      const response = await ApiRequest({
        method: "GET",
        url: `/filteredform?ty=detail&q=${param?.id}`,
        refreshtoken: true,
        cookie: true,
      });

      if (!response.success) {
        ErrorToast({
          toastid: "UniqueForm",
          title: "Not Found",
          content: "Form Not Found",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      const result = response.data as FormDataType;

      //Set form content
      dispatch(setformstate({ ...formstate, ...result, contents: undefined }));
      dispatch(setallquestion(result.contents ?? []));
    };

    AsyncGetForm();
  }, [param.id]);

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
          Solution
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

const QuestionTab = () => {
  //scroll ref
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [page, setpage] = useState(1);
  const [totalpage, settotalpage] = useState(1);

  const dispatch = useDispatch();
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );
  const formstate = useSelector((root: RootState) => root.allform.formstate);

  const AddConditionedQuestion = (idx: number, ansidx: number) => {
    dispatch(
      setallquestion((prev) => {
        const newQuestion = {
          ...DefaultContentType,
          parent_question: idx,
          parentanswer_idx: ansidx,
        };

        const result = [
          ...prev.slice(0, idx + 1),
          newQuestion,
          ...prev.slice(idx + 1),
        ];

        const updatedConditional = {
          QuestionIds: [
            ...(prev[idx].conditional?.QuestionIds ?? []).map((qidx) =>
              qidx >= idx + 1 ? qidx + 1 : qidx
            ),
            idx + 1, // Add the new index in the correct position
          ].sort((a, b) => a - b), // Ensure the array remains sorted
          key: [...(prev[idx].conditional?.key ?? []), ansidx],
        };

        result[idx] = {
          ...prev[idx],
          conditional: updatedConditional,
        };

        return result;
      })
    );
  };

  const removeConditionedQuestion = (idx: number, ansidx: number) => {
    // Remove condition based on key and question idx

    dispatch(
      setallquestion((prev) => {
        prev[idx].conditional = {
          QuestionIds:
            prev[idx].conditional?.QuestionIds?.filter(
              (item) => item !== idx + 1
            ) ?? [],
          key:
            prev[idx].conditional?.key?.filter((item) => item !== ansidx) ?? [],
        };
        return prev.filter((i) => i.parentanswer_idx !== ansidx);
      })
    );
  };

  const handleDeleteQuestion = (idx: number) => {
    let updatedQuestion = [...allquestion];

    const tobeDeleteQuestion = updatedQuestion[idx];

    const indicesToDelete = new Set([idx]);

    if (tobeDeleteQuestion.conditional) {
      const conditionQIds = tobeDeleteQuestion.conditional.QuestionIds;
      conditionQIds.forEach((qidx) => indicesToDelete.add(qidx));
    } else if (
      tobeDeleteQuestion.parent_question &&
      tobeDeleteQuestion.parentanswer_idx
    ) {
      //unlink question if it is a child questionq
      updatedQuestion = updatedQuestion.map((q, qidx) => {
        if (qidx === tobeDeleteQuestion.parent_question) {
          return {
            ...q,
            conditional: {
              ...q.conditional,

              key:
                q.conditional?.key.filter(
                  (i) => i !== tobeDeleteQuestion.parentanswer_idx
                ) ?? [],
              QuestionIds:
                q.conditional?.QuestionIds.filter((i) => i !== idx) ?? [],
            } as ConditionalType,
          };
        }
        return q;
      });
    }

    updatedQuestion = updatedQuestion.filter(
      (_, qidx) => !indicesToDelete.has(qidx)
    );

    // Update the state
    dispatch(setallquestion(updatedQuestion));
  };
  const handleDuplication = (idx: number) => {
    ///make a copy of the question base on idx
    dispatch(
      setallquestion((prev) => {
        const tobecopy = prev[idx];
        const result = [
          ...prev.slice(0, idx + 1),
          tobecopy,
          ...prev.slice(idx + 1),
        ];

        return result;
      })
    );
  };

  const checkIsLinkedForQuestionOption = (qidx: number, ansidx: number) =>
    allquestion.some(
      (i) => i.parent_question === qidx && i.parentanswer_idx === ansidx
    );

  const scrollToDiv = (key: string) => {
    const element = componentRefs.current[key];

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      style={{ color: formstate.setting?.text }}
      className="w-full h-fit flex flex-col items-center gap-y-10"
    >
      {allquestion.map(
        (question, idx) =>
          question.page === page && (
            <div
              className="w-[80%] h-fit"
              key={`${question.type}${idx}`}
              ref={(el) =>
                (componentRefs.current[`${question.type}${idx}`] = el)
              }
            >
              <QuestionComponent
                idx={idx}
                isLinked={(ansidx) =>
                  checkIsLinkedForQuestionOption(idx, ansidx)
                }
                value={question}
                color={formstate.setting?.qcolor as string}
                onDelete={() => {
                  handleDeleteQuestion(idx);
                }}
                onAddCondition={(answeridx) =>
                  AddConditionedQuestion(idx, answeridx)
                }
                removeCondition={(answeridx) =>
                  removeConditionedQuestion(idx, answeridx)
                }
                onDuplication={() => handleDuplication(idx)}
                scrollToCondition={scrollToDiv}
              />
            </div>
          )
      )}
      <Button
        startContent={<PlusIcon width={"25px"} height={"25px"} />}
        className="w-[90%] h-[40px] bg-success dark:bg-lightsucess font-bold text-white dark:text-black"
        onPress={() => {
          dispatch(
            setallquestion((prev) => [...prev, { ...DefaultContentType, page }])
          );
        }}
      >
        New Question
      </Button>
      <Pagination
        loop
        showControls
        color="primary"
        initialPage={1}
        total={totalpage}
        page={page}
        onChange={setpage}
      />
      <div className="page-btn w-full h-fit flex flex-row items-center justify-between">
        <Button
          className="max-w-xs font-bold text-red-400 border-x-0 border-t-0 transition-transform hover:translate-x-1"
          radius="none"
          style={totalpage === 1 || page === 1 ? { display: "none" } : {}}
          color="danger"
          variant="bordered"
          onPress={() => {
            dispatch(
              setopenmodal({
                state: "confirm",
                value: {
                  open: true,
                  data: {
                    onAgree: () => {
                      settotalpage((prev) => (prev > 1 ? prev - 1 : 1));
                      setpage(totalpage > 1 ? totalpage - 1 : 1);
                    },
                  },
                },
              })
            );
          }}
          startContent={
            <Image
              src={MinusIcon}
              alt="plus"
              width={20}
              height={20}
              loading="lazy"
            />
          }
        >
          Delete Page
        </Button>
        <Button
          className="max-w-xs font-bold text-black border-x-0  border-t-0 transition-transform hover:translate-x-1"
          radius="none"
          color="primary"
          variant="bordered"
          onPress={() => {
            settotalpage((prev) => prev + 1);
            setpage(totalpage + 1);
          }}
          startContent={
            <Image
              src={PlusImg}
              alt="plus"
              width={20}
              height={20}
              loading="lazy"
            />
          }
        >
          New Page
        </Button>
      </div>

      <Button color="danger" onPress={() => console.log({ allquestion })}>
        Test State
      </Button>
    </div>
  );
};

const Settingitem = ({
  content,
  action,
}: {
  content: string;
  action?: ReactNode;
}) => {
  return (
    <div className="w-full h-fit flex flex-row items-center justify-between p-2 border-b-2 border-b-gray-300">
      <p className="text-lg font-bold">{content}</p>
      {action}
    </div>
  );
};

const ReturnScoreOption: Array<SelectionType<string>> = [
  { label: "Partial", value: returnscore.partial },
  { label: "Manual", value: returnscore.manual },
];

const SettingOptions = (formtype: FormTypeEnum) => [
  {
    label: "Form Type",
    type: "select",
    state: "type",
    option: FormTypeOptions,
  },
  { label: "Question Color", type: "color", state: "qcolor" },
  { label: "Text Color", type: "color", state: "text" },
  { label: "Background Color", type: "color", state: "bg" },
  { label: "Limit to one reponse", type: "switch", state: "submitonce" },
  { label: "Email Required", type: "switch", state: "email" },
  formtype === FormTypeEnum.Quiz
    ? {
        label: "Return Score",
        type: "select",
        state: "returnscore",
        option: ReturnScoreOption,
      }
    : undefined,
];

const FormTypeOptions: Array<SelectionType<FormTypeEnum>> = [
  {
    label: "Normal",
    value: FormTypeEnum.Normal,
  },
  { label: "Quiz", value: FormTypeEnum.Quiz },
];

const SettingTab = () => {
  const [loading, setloading] = useState(false);
  const formstate = useSelector((root: RootState) => root.allform.formstate);
  const dispatch = useDispatch();
  const [isEdit, setisEdit] = useState(false);

  const handleSaveSetting = async (restoreValue?: Partial<FormSettingType>) => {
    setloading(true);
    const request = await ApiRequest({
      url: "/editform",
      method: "PUT",
      data: { setting: restoreValue ?? formstate.setting, _id: formstate._id },
      cookie: true,
      refreshtoken: true,
    });
    setloading(false);
    if (!request.success) {
      ErrorToast({
        title: "Failed",
        content: request.error ?? "Can't Save Setting",
      });
      return;
    }
    setisEdit(false);

    if (restoreValue) {
      dispatch(setformstate({ ...formstate, setting: DefaultFormSetting }));
    }
    SuccessToast({ title: "Success", content: "Setting Saved" });
  };

  const handleRestoreSetting = async () => {
    dispatch(
      setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: { onAgree: () => handleSaveSetting(DefaultFormSetting) },
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

  return (
    <div className="setting-tab w-[80%] h-fit flex flex-col items-center gap-y-10 bg-white p-2 rounded-lg">
      <span className="text-red-300">
        {"when customize color please make sure all content are visible"}
      </span>
      {SettingOptions(formstate.type as FormTypeEnum).map(
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
          onPress={() => handleSaveSetting()}
          className="text-white font-bold"
        >
          Save
        </Button>
      </div>
    </div>
  );
};
