import { Button, Switch } from "@heroui/react";
import { AsyncSaveForm, setformstate } from "../../../redux/formstore";
import {
  BgColorTemplate,
  FormDataType,
  FormTypeEnum,
  returnscore,
  getDefaultFormSetting,
} from "../../../types/Form.types";
import { SelectionType } from "../../../types/Global.types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { ReactNode, useCallback, useState } from "react";
import { setopenmodal } from "../../../redux/openmodal";
import { hasObjectChanged } from "../../../helperFunc";
import Selection from "../Selection";
import { CustomizeColorPicker } from "./Setting_component";
import FormOwnerManager from "../../FormOwnerManager";

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
      color?: Record<string, string>;
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
      color: BgColorTemplate,
    },
    {
      label: "Background Color",
      type: "color",
      state: "bg",
      section: "Customize",
      color: BgColorTemplate,
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
      label: "Allow Guest",
      type: "switch",
      state: "acceptGuest",
      section: "General",
    },

    {
      label: "Auto Save",
      type: "switch",
      state: "autosave",
      section: "General",
    },
    {
      label: "Accept Responses",
      type: "switch",
      state: "acceptResponses",
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
  const [showOwnerManager, setShowOwnerManager] = useState(false);

  const handleRestoreSetting = async () => {
    dispatch(
      setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: {
            onAgree: () => {
              const defaultSettings = getDefaultFormSetting(
                formstate.type as FormTypeEnum
              );
              dispatch(
                AsyncSaveForm({
                  type: "edit",
                  data: { setting: defaultSettings, _id: formstate._id },
                  onSuccess: () =>
                    dispatch(
                      setformstate({
                        ...formstate,
                        setting: defaultSettings,
                      })
                    ),
                }) as never
              );
            },
          },
        },
      })
    );
  };

  const handleIsSaved = (newValue: Partial<FormDataType>) => {
    const prevValue = { ...formstate };

    const isChange = hasObjectChanged(prevValue, newValue);

    setisEdit(isChange);
  };

  const handleChangeSetting = (newVal: Partial<FormDataType> | string) => {
    type SettingType = NonNullable<FormDataType["setting"]>;

    if (typeof newVal === "string") {
      return (
        formstate[newVal as keyof FormDataType] ??
        formstate.setting?.[newVal as keyof SettingType]
      );
    }

    const settingKeys = new Set<keyof SettingType>(
      Object.keys(formstate.setting ?? {}) as (keyof SettingType)[]
    );
    if (!settingKeys.has("acceptResponses")) settingKeys.add("acceptResponses");

    console.log({ settingKeys });

    const baseUpdatedState: FormDataType = {
      ...formstate,
      setting: {
        ...(formstate.setting ?? {}),
        ...Object.fromEntries(
          Object.entries(newVal).filter(([key]) =>
            settingKeys.has(key as keyof SettingType)
          )
        ),
      },
      ...Object.fromEntries(
        Object.entries(newVal).filter(
          ([key]) => !settingKeys.has(key as keyof SettingType)
        )
      ),
    };

    let updatedState = baseUpdatedState;

    if (newVal.type && newVal.type !== formstate.type) {
      const newType = newVal.type as FormTypeEnum;
      const defaultSettings = getDefaultFormSetting(newType);

      if (newType === FormTypeEnum.Quiz) {
        updatedState = {
          ...updatedState,
          setting: {
            ...updatedState.setting,
            returnscore:
              formstate.setting?.returnscore ?? defaultSettings.returnscore,
          },
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { returnscore, ...settingsWithoutReturnScore } =
          updatedState.setting || {};
        updatedState = {
          ...updatedState,
          setting: settingsWithoutReturnScore,
        };
      }
    }

    dispatch(setformstate(updatedState));
    handleIsSaved(newVal);

    return updatedState;
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

  const Settingitem = useCallback(
    ({ content, action }: { content: string; action?: ReactNode }) => {
      return (
        <div className="w-full h-fit flex flex-row items-center justify-between p-2 border-b-2 border-b-gray-300">
          <p className="text-lg font-normal">{content}</p>
          {action}
        </div>
      );
    },
    []
  );

  return (
    <div className="setting-tab w-[80%] h-fit flex flex-col items-center gap-y-10 bg-white p-2 rounded-lg">
      {Object.entries(groupedOptions).map(([section, item]) => (
        <div key={`${section} of setting`} className="w-full h-fit">
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
                    setting.type === "color" && setting.color ? (
                      <CustomizeColorPicker
                        colors={setting.color}
                        value={
                          formstate.setting
                            ? formstate.setting[setting.state as never]
                            : ""
                        }
                        onChange={(val) => {
                          handleChangeSetting({ [setting.state]: val });
                        }}
                      />
                    ) : setting.type === "select" ? (
                      <Selection
                        className="w-[150px]"
                        items={setting.option ?? []}
                        selectedKeys={[
                          handleChangeSetting(setting.state) as string,
                        ]}
                        onChange={(val) =>
                          handleChangeSetting({
                            [setting.state]: val.target.value,
                          })
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
                                isSelected: handleChangeSetting(
                                  setting.state
                                ) as boolean,
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
        </div>
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

      {/* Collaborative Features Section */}
      <div className="collaborative w-full h-full flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <p className="text-lg font-bold">Collaboration</p>
          <p className="text-sm text-gray-600">
            Manage form access and collaborative editing
          </p>
        </div>
        <Button
          color="primary"
          variant="bordered"
          className="font-bold max-w-sm"
          onPress={() => setShowOwnerManager(true)}
        >
          Manage Access
        </Button>
      </div>

      {/* Owner Manager Modal */}
      {showOwnerManager && (
        <FormOwnerManager
          isOpen={showOwnerManager}
          onClose={() => setShowOwnerManager(false)}
        />
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
          onPress={() =>
            dispatch(
              AsyncSaveForm({
                type: "edit",
                data: {
                  type: formstate.type,
                  setting: formstate.setting,
                  _id: formstate._id,
                },
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

export default SettingTab;
