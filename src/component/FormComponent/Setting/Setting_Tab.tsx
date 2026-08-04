import { Button, Switch } from "@heroui/react";
import {
  AsyncSaveForm,
  setallformstate,
  setformstate,
  setreloaddata,
} from "../../../redux/formstore";
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
import { ReactNode, useCallback, useEffect, useState } from "react";
import { ConfirmModalDataType, setopenmodal } from "../../../redux/openmodal";
import { hasObjectChanged } from "../../../helperFunc";
import Selection from "../Selection";
import { CustomizeColorPicker } from "./Setting_component";
import FormOwnerManager from "../../FormOwnerManager";
import ApiRequest from "../../../hooks/APIHook/ApiHook";
import SuccessToast, { ErrorToast } from "../../Modal/AlertModal";
import { useNavigate } from "react-router-dom";

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

//Request handler
const asyncRemoveSelfFromForm = async () => {
  const removeReq = await ApiRequest({
    method: "DELETE",
    url: "/removeselfform",
    cookie: true,
  });

  if (!removeReq.success) {
    throw new Error(removeReq.error ?? "Unexpected Error");
  }

  return removeReq;
};

const SettingTab = ({
  onUnsavedChange,
}: {
  onUnsavedChange?: (hasUnsaved: boolean) => void;
}) => {
  const { formstate, loading, allformstate } = useSelector(
    (root: RootState) => root.allform,
  );
  const dispatch = useDispatch();
  const [isEdit, setisEdit] = useState(false);
  const [showOwnerManager, setShowOwnerManager] = useState(false);

  useEffect(() => {
    onUnsavedChange?.(isEdit);
  }, [isEdit, onUnsavedChange]);

  useEffect(() => {
    if (!isEdit) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEdit]);
  const navigate = useNavigate();

  const handleRestoreSetting = async () => {
    dispatch(
      setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: {
            onAgree: () => {
              const defaultSettings = getDefaultFormSetting(
                formstate.type as FormTypeEnum,
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
                      }),
                    ),
                }) as never,
              );
            },
          },
        },
      }),
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
      Object.keys(formstate.setting ?? {}) as (keyof SettingType)[],
    );
    if (!settingKeys.has("acceptResponses")) settingKeys.add("acceptResponses");

    console.log({ settingKeys });

    const baseUpdatedState: FormDataType = {
      ...formstate,
      setting: {
        ...(formstate.setting ?? {}),
        ...Object.fromEntries(
          Object.entries(newVal).filter(([key]) =>
            settingKeys.has(key as keyof SettingType),
          ),
        ),
      },
      ...Object.fromEntries(
        Object.entries(newVal).filter(
          ([key]) => !settingKeys.has(key as keyof SettingType),
        ),
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

  const handleRemoveSelf = useCallback(async () => {
    const mutation = await asyncRemoveSelfFromForm();

    if (!mutation.success) {
      ErrorToast({
        toastid: "Removeself",
        title: "Error",
        content: mutation.error ?? "Unexpected Error",
      });
    }

    //Success
    dispatch(setreloaddata(true));

    SuccessToast({
      toastid: "Sucess RemoveSelf",
      title: "Sucess",
      content: mutation.message ?? "Sucessfully",
    });

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 150);
  }, [dispatch, navigate]);
  const groupedOptions = SettingOptions(formstate.type as FormTypeEnum).reduce(
    (acc, option) => {
      const section = option?.section ?? "Misc"; // Default section if missing
      if (!acc[section]) acc[section] = [] as never;
      const otheracc = acc[section] as unknown as Array<object>;
      otheracc.push(option as never);
      return acc;
    },
    {} as Record<string, typeof SettingOptions>,
  );

  const handleDeleteForm = useCallback(async () => {
    try {
      const deleteReq = await ApiRequest({
        method: "DELETE",
        url: "/deleteform",
        cookie: true,
        data: { ids: [formstate._id] },
      });

      if (!deleteReq.success) {
        throw new Error(deleteReq.error ?? "Failed to delete form");
      }

      SuccessToast({
        toastid: "DeleteForm",
        title: "Success",
        content: "Form deleted successfully",
      });

      // Redirect to dashboard after deletion
      setTimeout(() => {
        //Instantly Update State
        dispatch(
          setallformstate(
            allformstate.filter((form) => form._id !== formstate._id),
          ),
        );
        navigate("/", { replace: true });
      }, 500);
    } catch (error) {
      ErrorToast({
        toastid: "DeleteFormError",
        title: "Error",
        content:
          error instanceof Error ? error.message : "Failed to delete form",
      });
    }
  }, [allformstate, dispatch, formstate._id, navigate]);

  const confirmDeleteForm = useCallback(() => {
    dispatch(
      setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: {
            question:
              "Are you sure you want to delete this form? This action cannot be undone and will permanently remove all responses.",
            onAgree: handleDeleteForm,
          },
        },
      }),
    );
  }, [dispatch, handleDeleteForm]);

  const Settingitem = useCallback(
    ({
      content,
      description,
      action,
    }: {
      content: string;
      description?: string;
      action?: ReactNode;
    }) => {
      return (
        <div className="flex items-center justify-between px-4 py-3.5 gap-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-medium dark:text-gray-200">{content}</p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      );
    },
    [],
  );

  return (
    <div className="setting-tab w-full max-w-2xl mx-auto flex flex-col gap-y-8 py-4 px-2 sm:px-0">
      {Object.entries(groupedOptions).map(([section, item]) => (
        <div key={`${section} of setting`} className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
            {section}
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            {(item as unknown as SettingOptionType).map(
              (setting, idx) =>
                setting && (
                  <Settingitem
                    key={idx}
                    content={setting.label ?? ""}
                    description={
                      setting.state === "autosave"
                        ? "Applies to the Question tab only"
                        : undefined
                    }
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
                          aria-label={`Select ${setting.label}`}
                        />
                      ) : setting.type === "switch" ? (
                        <Switch
                          size="sm"
                          onValueChange={(val) =>
                            handleChangeSetting({ [setting.state]: val })
                          }
                          aria-label={setting.label}
                          {...(formstate.setting
                            ? {
                                isSelected: handleChangeSetting(
                                  setting.state,
                                ) as boolean,
                              }
                            : {})}
                        />
                      ) : (
                        <></>
                      )
                    }
                  />
                ),
            )}
          </div>
        </div>
      ))}

      {formstate.isCreator && (
        <div className="dangerous w-full h-fit border-2 border-red-500/30 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                Danger Zone
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Once you delete this form, there is no going back. Please be
                certain.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-md border border-red-200 dark:border-red-800">
              <div className="flex flex-col gap-1">
                <p className="text-md font-semibold dark:text-gray-100">
                  Delete this form
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This will permanently delete the form and all its responses.
                  This action cannot be undone.
                </p>
              </div>
              <Button
                color="danger"
                variant="solid"
                className="font-bold w-fit"
                onPress={confirmDeleteForm}
              >
                Delete Form Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collaborative Features Section */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
          Collaboration
        </p>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3.5 gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium dark:text-gray-200">
                Form Access
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage form access and collaborative editing
              </p>
            </div>
            {formstate.isEditor ? (
              <Button
                color="danger"
                variant="flat"
                size="sm"
                className="font-semibold shrink-0"
                onPress={() => {
                  const value: ConfirmModalDataType = {
                    open: true,
                    data: {
                      question: "Are you sure ? (Action can't undo)",
                      onAgree: () => handleRemoveSelf(),
                    },
                  };
                  dispatch(setopenmodal({ state: "confirm", value }));
                }}
              >
                Leave Form
              </Button>
            ) : (
              <Button
                color="primary"
                variant="flat"
                size="sm"
                className="font-semibold shrink-0"
                onPress={() => setShowOwnerManager(true)}
              >
                Manage Access
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Owner Manager Modal */}
      {showOwnerManager && (
        <FormOwnerManager
          isOpen={showOwnerManager}
          onClose={() => setShowOwnerManager(false)}
        />
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          isLoading={loading}
          variant="flat"
          onPress={() => handleRestoreSetting()}
          className="font-semibold"
        >
          Restore Defaults
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
              }) as never,
            )
          }
          className="text-white font-semibold"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SettingTab;
