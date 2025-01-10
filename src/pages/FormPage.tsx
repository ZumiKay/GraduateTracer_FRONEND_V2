import { Button, Switch, Tab, Tabs } from "@nextui-org/react";
import { useParams } from "react-router";
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
  FormSetiingDataType,
  FormType,
} from "../types/Form.types";
import { useDispatch, useSelector } from "react-redux";
import globalindex from "../redux/globalindex";
import { RootState } from "../redux/store";
import { setallquestion } from "../redux/formstore";

export default function FormPage() {
  const param = useParams();
  const dispatch = useDispatch();
  const [settingstate, setsettingstate] = useState(DefaultFormSetting);

  useEffect(() => {
    //Verfication form First before asssign title to the navbar
    dispatch(globalindex.actions.setformtitle(param.id));
  }, []);

  return (
    <div
      style={{ backgroundColor: settingstate.background }}
      className="formpage w-full min-h-screen h-full"
    >
      <Tabs className="w-full h-fit bg-white" variant="underlined">
        <Tab key={"question"} title="Question">
          <div className="w-full min-h-screen h-full pt-5">
            <QuestionTab
              color={settingstate.question}
              textcolor={settingstate.text}
            />
          </div>
        </Tab>
        <Tab key={"solution"} title="Solution">
          Solution
        </Tab>
        <Tab key={"response"} title="Response"></Tab>
        <Tab key={"setting"} title="Setting">
          <div className="w-full min-h-screen h-full grid place-items-center">
            <SettingTab
              settingstate={settingstate}
              setsettingstate={setsettingstate}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

const QuestionTab = ({
  color,
  textcolor,
}: {
  color: string;
  textcolor: string;
}) => {
  //scroll ref
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const dispatch = useDispatch();
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );

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
      style={{ color: textcolor }}
      className="w-full h-fit flex flex-col items-center gap-y-10"
    >
      {allquestion.map((question, idx) => (
        <div
          className="w-[80%] h-fit"
          key={`${question.type}${idx}`}
          ref={(el) => (componentRefs.current[`${question.type}${idx}`] = el)}
        >
          <QuestionComponent
            idx={idx}
            isLinked={(ansidx) => checkIsLinkedForQuestionOption(idx, ansidx)}
            value={question}
            color={color}
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
      ))}
      <Button
        startContent={<PlusIcon width={"25px"} height={"25px"} />}
        className="w-[90%] h-[40px] bg-success dark:bg-lightsucess font-bold text-white dark:text-black"
        onPress={() => {
          dispatch(setallquestion((prev) => [...prev, DefaultContentType]));
        }}
      >
        New Question
      </Button>
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

const SettingOptions = [
  { label: "Form Type", type: "select", state: "formtype" },
  { label: "Question Color", type: "color", state: "question" },
  { label: "Text Color", type: "color", state: "text" },
  { label: "Background Color", type: "color", state: "background" },
  { label: "Limit to one reponse", type: "switch", state: "response" },
  { label: "Email Required", type: "switch", state: "email" },
];

const FormTypeOptions: Array<SelectionType<FormType>> = [
  {
    label: "Normal",
    value: "NORMAL",
  },
  { label: "Quiz", value: "QUIZ" },
];

const SettingTab = ({
  settingstate,
  setsettingstate,
}: {
  settingstate: FormSetiingDataType;
  setsettingstate: React.Dispatch<React.SetStateAction<FormSetiingDataType>>;
}) => {
  return (
    <div className="setting-tab w-[80%] h-fit flex flex-col items-center gap-y-10 bg-white p-2 rounded-lg">
      <span className="text-red-300">
        {"when customize color please make sure all content are visible"}
      </span>
      {SettingOptions.map((setting, idx) => (
        <Settingitem
          key={idx}
          content={setting.label}
          action={
            setting.type === "color" ? (
              <ColorSelection
                value={settingstate[setting.state as never]}
                onChange={(val) => {
                  setsettingstate((prev) => ({
                    ...prev,
                    [setting.state]: val,
                  }));
                }}
              />
            ) : setting.type === "select" ? (
              <Selection className="w-[100px]" items={FormTypeOptions} />
            ) : setting.type === "switch" ? (
              <Switch
                checked={settingstate[setting.state as never]}
                onChange={(val) =>
                  setsettingstate((prev) => ({
                    ...prev,
                    [settingstate[setting.state as never]]: val.target.checked,
                  }))
                }
                aria-label="Limit to one reponse"
              />
            ) : (
              <></>
            )
          }
        />
      ))}

      <div className="btn_section w-full h-[40px] flex flex-row items-center gap-x-5">
        <Button className="bg-slate-400 text-white font-bold">Restore</Button>
        <Button color="success" className="text-white font-bold">
          Save
        </Button>
      </div>
    </div>
  );
};
