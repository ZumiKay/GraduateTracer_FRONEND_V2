import {
  Button,
  Image,
  Pagination,
  Skeleton,
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
  ContentType,
  DefaultContentType,
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
  setpage,
  setprevallquestion,
  setreloaddata,
} from "../redux/formstore";
import PlusImg from "../assets/add.png";
import MinusIcon from "../assets/minus.png";
import { setopenmodal } from "../redux/openmodal";
import ApiRequest, { ApiRequestReturnType } from "../hooks/ApiHook";
import { ErrorToast, PromiseToast } from "../component/Modal/AlertModal";
import { hasObjectChanged } from "../helperFunc";
import { AutoSaveQuestion } from "./FormPage.action";

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

  const { formstate, page, fetchloading } = useSelector(
    (root: RootState) => root.allform
  );
  const [searchParam, setsearchParam] = useSearchParams();

  const dispatch = useDispatch();
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );

  const handleAddQuestion = async () => {
    const updatedQuestions = [...allquestion, { ...DefaultContentType, page }];
    if (formstate.setting?.autosave) {
      const createReq = AutoSaveQuestion({
        data: updatedQuestions,
        formId: formstate._id ?? "",
        type: "save",
        page,
      });
      const process = await PromiseToast(
        { promise: createReq },
        { pending: "Creating", error: "Can't Create" }
      );
      if (!process.success || !process.data || !process.data.insertedId) return;
      dispatch(
        setallquestion((prev) => [
          ...prev,
          { ...DefaultContentType, _id: process.data?.insertedId[0], page },
        ])
      );
    } else
      dispatch(
        setallquestion((prev) => [...prev, { ...DefaultContentType, page }])
      );
  };

  const handleDeleteQuestion = async (qidx: number, id?: string) => {
    const questionToDelete = allquestion[qidx];

    const deleteRequest = async () => {
      if (id && formstate.setting?.autosave) {
        const request = await PromiseToast(
          {
            promise: ApiRequest({
              url: "/deletecontent",
              method: "DELETE",
              cookie: true,
              refreshtoken: true,
              data: { id, formId: formstate._id },
            }),
          },
          { pending: "Deleting Question", error: "Can't Delete" }
        );

        if (!request.success) return;
      }

      //Instance Update Questions

      dispatch(
        setallquestion((prev) =>
          prev
            .map((i) =>
              i.conditional?.some(
                (con) => (id && con.contentId === id) || con.contentId === qidx
              )
                ? {
                    ...i,
                    conditional: i.conditional.filter(
                      (cond) =>
                        (id && cond.contentId !== id) || cond.contentId !== qidx
                    ),
                  }
                : i
            )
            .filter(
              (question, idx) => (id && question._id !== id) || idx !== qidx
            )
        )
      );
    };

    if (questionToDelete.conditional && questionToDelete.conditional.length > 0)
      dispatch(
        setopenmodal({
          state: "confirm",
          value: { open: true, data: { onAgree: deleteRequest } },
        })
      );
    else await deleteRequest();
  };

  const handleAddCondition = async (
    questionId: string | number,
    anskey: number
  ) => {
    const toUpdateQuestion = {
      ...allquestion.find((question, idx) => {
        if (question._id) {
          return question._id === questionId;
        }
        return idx === questionId;
      }),
    };

    let newContentId: number | string = 0;

    //Add Condition
    if (toUpdateQuestion) {
      if (formstate.setting?.autosave) {
        const request = await PromiseToast(
          {
            promise: ApiRequest({
              url: "/handlecondition",
              method: "POST",
              cookie: true,
              refreshtoken: true,
              data: {
                contentId: questionId,
                key: anskey,
                newContent: { ...DefaultContentType, page },
                formId: formstate._id,
              },
            }),
          },
          { pending: "Adding", success: "Condition Added", error: "Can't Add" }
        );
        if (!request.success || !request.data) {
          return;
        }
        newContentId = request.data.newContentId as string;
      } else {
        newContentId = questionId;
      }

      dispatch(
        setallquestion((prev) => {
          const index =
            typeof questionId === "number"
              ? questionId
              : prev.findIndex((q) => q._id === toUpdateQuestion._id);

          if (index === -1) return prev; // If not found, return previous state

          // Create a new updated list
          const updatedList = [
            ...prev.map((i, idx) =>
              idx === index
                ? {
                    ...i,
                    conditional: [
                      ...(i.conditional ?? []),
                      {
                        contentId: newContentId,
                        key: anskey,
                      },
                    ],
                  }
                : i
            ),
          ] as ContentType[];

          // Update the existing question

          // Insert new content **correctly** after the updated question
          return [
            ...updatedList.slice(0, index + 1), // Keep elements before and including the updated one
            {
              ...DefaultContentType,
              page,
              _id: typeof newContentId === "string" ? newContentId : undefined,
            }, // Insert new question
            ...updatedList.slice(index + 1), // Append the remaining elements
          ];
        })
      );
    }
  };

  const removeConditionedQuestion = async (
    ansidx: number,
    qidx: number,
    ty: "unlink" | "delete"
  ) => {
    // handle Remove Conditioned Option
    let toremoveQuestion: string | number | null = null;
    const UpdatedQuestion = [
      ...allquestion
        .map((question, idx) => {
          if (idx !== qidx) return question; // Return unchanged questions

          // Clone the question and filter out the specific answer index
          const updatedQuestion = { ...question };
          const typeKey = updatedQuestion.type as keyof typeof updatedQuestion;

          if (Array.isArray(updatedQuestion[typeKey]) && ty === "delete") {
            updatedQuestion[typeKey] = updatedQuestion[typeKey].filter(
              (_, i) => i !== ansidx
            ) as never;
          }
          toremoveQuestion =
            updatedQuestion.conditional?.find((con) => con.key === ansidx)
              ?.contentId ?? null;

          return {
            ...updatedQuestion,
            conditional: updatedQuestion.conditional?.filter(
              (con) => con.contentId !== toremoveQuestion
            ),
          };
        })
        .filter((q, idx) =>
          toremoveQuestion
            ? typeof toremoveQuestion === "string"
              ? q._id !== toremoveQuestion
              : idx !== toremoveQuestion
            : q
        ),
    ];

    if (formstate.setting?.autosave && formstate._id) {
      const isSaved = await PromiseToast({
        promise: AutoSaveQuestion({
          data: UpdatedQuestion,
          formId: formstate._id,
          type: "save",
          page,
        }),
      });

      if (!isSaved) {
        ErrorToast({ title: "Failed", content: "Error occured" });
        return;
      }
    }

    dispatch(setallquestion(UpdatedQuestion));
  };

  const handleDuplication = async (idx: number) => {
    ///make a copy of the question base on idx
    const updatequestions = [
      ...allquestion.slice(0, idx + 1),
      { ...allquestion[idx], _id: undefined },
      ...allquestion.slice(idx + 1),
    ];

    if (formstate.setting?.autosave && formstate._id) {
      const isSaved = await PromiseToast(
        {
          promise: AutoSaveQuestion({
            data: updatequestions,
            formId: formstate._id,
            type: "save",
            page,
          }),
        },
        { pending: "Copying" }
      );

      if (!isSaved) {
        ErrorToast({ title: "Failed", content: "Can't Save" });
        return;
      }
    }
    dispatch(setallquestion(updatequestions));
  };

  const checkIsLinkedForQuestionOption = (ansidx: number, qidx: number) =>
    allquestion[qidx] && allquestion[qidx].conditional
      ? allquestion[qidx].conditional.some((con) => con.key === ansidx)
      : false;
  const checkConditionedContent = (id: string | number) => {
    const qIdx = allquestion.findIndex(
      (i) => i.conditional && i.conditional.some((con) => con.contentId === id)
    );
    const key = `${allquestion[qIdx]?.type}${allquestion[qIdx]?._id ?? qIdx}`;
    const ansIdx =
      allquestion[qIdx]?.conditional?.find((con) => con.contentId === id)
        ?.key ?? 0;
    return { key, qIdx, ansIdx };
  };

  const scrollToDiv = (key: string) => {
    const element = componentRefs.current[key];

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePage = async (type: "add" | "delete", deletepage?: number) => {
    let updatedPage = 0;
    const updateSearchParam = (newPage: number) => {
      dispatch(setpage(newPage));
      dispatch(setformstate({ ...formstate, totalpage: newPage }));
      setsearchParam((prev) => ({ ...prev, page: newPage }));
    };

    if (type === "add") {
      //Add new page
      updatedPage = formstate.totalpage + 1;
      updateSearchParam(updatedPage);
    } else {
      updatedPage = formstate.totalpage;

      updateSearchParam(updatedPage <= 1 ? 1 : updatedPage - 1);
    }
    //Save Page

    const request = (await PromiseToast(
      {
        promise: ApiRequest({
          url: "/modifypage",
          method: "PUT",
          cookie: true,
          refreshtoken: true,
          data: {
            formId: formstate._id,
            ty: type,
            deletepage,
          },
        }),
      },
      { pending: "Adding Page", success: "Added" }
    )) as ApiRequestReturnType;

    if (!request.success) {
      ErrorToast({ title: "Failed", content: "Can't Save" });
      return;
    }
    if (type === "delete") dispatch(setreloaddata(true));
  };

  return (
    <div
      style={{ color: formstate.setting?.text }}
      className="w-full h-fit flex flex-col items-center gap-y-20"
    >
      {fetchloading ? (
        <Skeleton className="w-[80%] h-[300px] rounded-md" />
      ) : (
        allquestion
          .filter((i) => i.page === page)
          .map((question, idx) => (
            <div
              className="w-[80%] h-fit"
              key={`${question.type}${question._id ?? idx}`}
              ref={(el) =>
                (componentRefs.current[
                  `${question.type}${question._id ?? idx}`
                ] = el)
              }
            >
              <QuestionComponent
                idx={idx}
                id={question._id}
                isLinked={(ansidx) =>
                  checkIsLinkedForQuestionOption(ansidx, idx)
                }
                value={question}
                color={formstate.setting?.qcolor as string}
                onDelete={() => {
                  handleDeleteQuestion(idx, question._id);
                }}
                onAddCondition={(answeridx) =>
                  handleAddCondition(question._id ?? idx, answeridx)
                }
                removeCondition={(answeridx, ty) => {
                  removeConditionedQuestion(answeridx, idx, ty);
                }}
                onDuplication={() => handleDuplication(idx)}
                scrollToCondition={(val) => {
                  scrollToDiv(val);
                }}
                isConditioned={() =>
                  checkConditionedContent(question._id ?? idx)
                }
              />
            </div>
          ))
      )}
      <Button
        startContent={<PlusIcon width={"25px"} height={"25px"} />}
        className="w-[90%] h-[40px] bg-success dark:bg-lightsucess font-bold text-white dark:text-black"
        onPress={() => {
          handleAddQuestion();
        }}
      >
        New Question
      </Button>
      {formstate.totalpage > 1 ? (
        <Pagination
          loop
          showControls
          color="primary"
          initialPage={1}
          total={formstate.totalpage ?? 0}
          page={page}
          onChange={(val) => {
            setsearchParam({ ...searchParam, page: val.toString() });
            dispatch(setpage(val) as never);
            dispatch(setreloaddata(true));
          }}
        />
      ) : (
        ""
      )}
      <div className="page-btn w-full h-fit flex flex-row items-center justify-between">
        <Button
          className="max-w-xs font-bold text-red-400 border-x-0 border-t-0 transition-transform hover:translate-x-1"
          radius="none"
          style={
            formstate.totalpage === 1 || page === 1 ? { display: "none" } : {}
          }
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
                      handlePage("delete", page);
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
            handlePage("add");
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
