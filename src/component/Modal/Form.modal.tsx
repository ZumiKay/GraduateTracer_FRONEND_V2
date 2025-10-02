/**
 * Form Creation/Edit Modal Component
 *
 * Features:
 * - Uses React Query for data fetching and mutations
 * - Supports both creating new forms and editing existing forms
 * - Return Score option only available for Quiz type forms
 * - Default return score is "manual" for Quiz forms
 * - Proper form validation and error handling
 * - Optimistic updates with query invalidation
 */

import { Button, Checkbox, Form, Input } from "@heroui/react";
import ModalWrapper from "./Modal";
import { SelectionType } from "../../types/Global.types";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  FormDataType,
  FormTypeEnum,
  returnscore,
} from "../../types/Form.types";
import { createQueryFn, createMutationFn } from "../../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "./AlertModal";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateFormResponse {
  code: number;
  message: string;
  data?: {
    _id: string;
    [key: string]: unknown;
  };
}

interface CreateFormProps {
  open: boolean;
  setopen: () => void;
  id?: string;
}

const FormTypeOptions: Array<SelectionType<string>> = [
  { label: "Quiz", value: FormTypeEnum.Quiz },
  { label: "Normal", value: FormTypeEnum.Normal },
];

const ReturnScoreOptions: Array<SelectionType<string>> = [
  { label: "Partial", value: returnscore.partial },
  { label: "Manual", value: returnscore.manual },
];

export default function CreateForm({
  open,
  setopen: setclose,
  id,
}: CreateFormProps) {
  const [formtype, setformtype] = useState<FormTypeEnum>(FormTypeEnum.Normal);
  const [selectedReturnScore, setSelectedReturnScore] = useState<string>(
    returnscore.manual
  );
  const [requireEmail, setRequireEmail] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch form data for editing using React Query
  const {
    data: formData,
    isLoading: isFetchingForm,
    error: fetchError,
  } = useQuery({
    queryKey: ["form", id],
    queryFn: createQueryFn({
      url: `/filteredform?ty=detail&q=${id}`,
      method: "GET",
      cookie: true,
      refreshtoken: true,
    }),
    enabled: !!id && open, // Only fetch when id exists and modal is open
    retry: 1,
  });

  // Reset form state
  const resetFormState = useCallback(() => {
    setformtype(FormTypeEnum.Normal);
    setSelectedReturnScore(returnscore.manual);
    setRequireEmail(false);
    formRef.current?.reset();
  }, []);

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: createMutationFn({
      method: id ? "PUT" : "POST",
      url: id ? `/updateform/${id}` : "/createform",
      cookie: true,
      refreshtoken: true,
    }),
    onSuccess: (response: unknown) => {
      SuccessToast({
        toastid: "createform",
        title: "Success",
        content: id ? "Form Updated Successfully" : "Form Created Successfully",
      });

      resetFormState();
      setclose();

      const responseData = response as CreateFormResponse;
      const formId = id || responseData?.data?._id;
      if (formId) {
        navigate(`/form/${formId}`, { replace: true });
      }

      queryClient.invalidateQueries({ queryKey: ["forms"] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["form", id] });
        queryClient.invalidateQueries({ queryKey: ["FormInfo", id] });
      } else {
        const newFormId = responseData?.data?._id;
        if (newFormId) {
          queryClient.invalidateQueries({ queryKey: ["form", newFormId] });
          queryClient.invalidateQueries({ queryKey: ["FormInfo", newFormId] });
        }
      }
    },
    onError: (error: Error) => {
      ErrorToast({
        toastid: "createform",
        title: "Error",
        content: error.message || "An error occurred",
      });
    },
  });

  const handleFormTypeChange = useCallback((value: string) => {
    const newFormType = value as FormTypeEnum;
    setformtype(newFormType);

    // Reset return score to manual when switching to Normal type
    if (newFormType === FormTypeEnum.Normal) {
      setSelectedReturnScore(returnscore.manual);
    }
  }, []);

  useEffect(() => {
    if (formData && formRef.current && id) {
      try {
        const typedFormData = formData.data as FormDataType;
        const formElements = formRef.current.elements;

        if (typedFormData.type) {
          setformtype(typedFormData.type as FormTypeEnum);
        }

        if (typedFormData.setting && typedFormData.type === FormTypeEnum.Quiz) {
          const settings = typedFormData.setting as Record<string, unknown>;
          if (settings.returnscore) {
            setSelectedReturnScore(settings.returnscore as string);
          }
        }

        for (const [key, value] of Object.entries(typedFormData)) {
          const element = formElements.namedItem(key);
          if (!element) continue;

          if (
            element instanceof HTMLInputElement &&
            element.type === "checkbox"
          ) {
            element.checked = Boolean(value);
          } else if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement
          ) {
            element.value = String(value ?? "");
          }
        }

        if (typedFormData.setting) {
          const settings = typedFormData.setting as Record<string, unknown>;

          // Set email state if it exists
          if (settings.email !== undefined) {
            setRequireEmail(Boolean(settings.email));
          }

          for (const [key, value] of Object.entries(settings)) {
            if (key === "returnscore") continue; // Already handled above
            const element = formElements.namedItem(key);
            if (
              element instanceof HTMLInputElement &&
              element.type === "checkbox"
            ) {
              element.checked = Boolean(value);
            } else if (element) {
              (element as HTMLInputElement).value = String(value ?? "");
            }
          }
        }
      } catch (error) {
        console.error("Error populating form:", error);
        ErrorToast({
          toastid: "editform",
          title: "Error",
          content: "Failed to load form data",
        });
      }
    }
  }, [formData, id]);

  // Handle fetch error
  useEffect(() => {
    if (fetchError) {
      ErrorToast({
        toastid: "editform",
        title: "Error",
        content: fetchError.message || "Failed to fetch form data",
      });
    }
  }, [fetchError]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const jsonFormState = Object.fromEntries(formData) as Partial<FormDataType>;

    const formElements = e.currentTarget.elements;
    const setting: { [key: string]: boolean | string } = {};

    if (formtype === FormTypeEnum.Quiz) {
      setting.returnscore = selectedReturnScore;
    }

    for (const element of formElements) {
      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        const name = element.name;
        setting[name] = element.checked;
      }
    }

    const finalFormData = {
      ...jsonFormState,
      type: formtype,
      setting,
      email: undefined, // Remove email from main data as it's in settings
    };

    // Submit the form using the mutation
    createFormMutation.mutate(finalFormData);
  };

  return (
    <ModalWrapper
      size="2xl"
      isOpen={open}
      onClose={() => {
        resetFormState();
        setclose();
      }}
      title={id ? "✨ Edit Form" : "🚀 Create New Form"}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          @keyframes pulse-subtle {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 2s infinite;
          }
        `}
      </style>
      <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl animate-fadeIn">
        {/* Form Description */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            {id
              ? "Update your form details and settings below"
              : "Create a beautiful form to collect responses and engage with your audience"}
          </p>
        </div>
        <Form
          ref={formRef}
          onSubmit={handleCreate}
          aria-label="Create Form"
          validationBehavior="native"
          className="formcreation w-full space-y-6"
        >
          {isFetchingForm && id ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <div
                    className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-600 rounded-full animate-spin"
                    style={{
                      animationDirection: "reverse",
                      animationDuration: "1.5s",
                    }}
                  ></div>
                </div>
                <p className="text-gray-600 text-sm animate-pulse-subtle">
                  Loading form data...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Form Title Input */}
              <div className="relative w-full">
                <Input
                  type="text"
                  name="title"
                  size="lg"
                  label="Form Title"
                  labelPlacement="outside"
                  placeholder="Enter an engaging title for your form..."
                  isRequired
                  className="transition-all duration-300 hover:scale-[1.02]"
                />
              </div>

              {/* Form Type Selector */}
              <div className="relative">
                <label
                  htmlFor="type-select"
                  className="block text-sm font-semibold text-gray-700 mb-3"
                >
                  Form Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="type-select"
                    name="type"
                    value={formtype}
                    onChange={(e) => handleFormTypeChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 hover:border-purple-400 hover:shadow-lg text-gray-700 font-medium appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select Form Type
                    </option>
                    {FormTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                {/* Form Type Description */}
                <div className="mt-2 text-xs text-gray-500">
                  {formtype === FormTypeEnum.Quiz && (
                    <span className="animate-fadeIn">
                      🧠 Quiz forms support scoring and automatic result
                      calculation
                    </span>
                  )}
                  {formtype === FormTypeEnum.Normal && (
                    <span className="animate-fadeIn">
                      📝 Normal forms are perfect for surveys and data
                      collection
                    </span>
                  )}
                  {!formtype && (
                    <span>
                      Choose the type that best fits your form's purpose
                    </span>
                  )}
                </div>
              </div>

              {/* Return Score - Only available for Quiz type */}
              {formtype === FormTypeEnum.Quiz && (
                <div className="relative animate-fadeIn">
                  <label
                    htmlFor="returnscore-select"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    Return Score Method
                  </label>
                  <div className="relative">
                    <select
                      id="returnscore-select"
                      name="returnscore"
                      value={selectedReturnScore}
                      onChange={(e) => setSelectedReturnScore(e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 hover:border-blue-400 hover:shadow-lg text-gray-700 font-medium appearance-none cursor-pointer"
                    >
                      {ReturnScoreOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Choose how quiz scores should be calculated and returned to
                    participants
                  </p>
                </div>
              )}

              {/* Form Settings */}
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Form Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group">
                    <Checkbox
                      name="email"
                      color="secondary"
                      isSelected={requireEmail}
                      onValueChange={setRequireEmail}
                      className="transition-all duration-200 group-hover:scale-105"
                      classNames={{
                        wrapper:
                          "before:border-2 before:border-gray-300 hover:before:border-purple-400 before:transition-colors before:duration-300",
                        icon: "text-white",
                        label: "text-gray-700 font-medium text-sm",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>📧 Require Email</span>
                      </div>
                    </Checkbox>
                    <p className="text-xs text-gray-500 mt-1 ml-6 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                      Participants must provide their email address
                    </p>
                  </div>

                  <div className="group">
                    <Checkbox
                      name="submitonce"
                      color="secondary"
                      className="transition-all duration-200 group-hover:scale-105"
                      classNames={{
                        wrapper:
                          "before:border-2 before:border-gray-300 hover:before:border-purple-400 before:transition-colors before:duration-300",
                        icon: "text-white",
                        label: "text-gray-700 font-medium text-sm",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>🔒 Response Once</span>
                      </div>
                    </Checkbox>
                    <p className="text-xs text-gray-500 mt-1 ml-6 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                      Users can only submit one response
                    </p>
                  </div>
                </div>

                {requireEmail && (
                  <div className="animate-fadeIn pt-2 border-t border-gray-200">
                    <div className="group">
                      <Checkbox
                        name="acceptGuest"
                        color="secondary"
                        className="transition-all duration-200 group-hover:scale-105"
                        classNames={{
                          wrapper:
                            "before:border-2 before:border-gray-300 hover:before:border-green-400 before:transition-colors before:duration-300",
                          icon: "text-white",
                          label: "text-gray-700 font-medium text-sm",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span>👤 Accept Guest Responses</span>
                        </div>
                      </Checkbox>
                      <p className="text-xs text-gray-500 mt-1 ml-6 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                        Allow anonymous users to respond without providing email
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  isLoading={createFormMutation.isPending || isFetchingForm}
                  type="submit"
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                >
                  {createFormMutation.isPending || isFetchingForm ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {id ? "Updating..." : "Creating..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {id ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Update Form
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Create Form
                        </>
                      )}
                    </div>
                  )}
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </ModalWrapper>
  );
}
