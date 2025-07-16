import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  DatePicker,
  Progress,
  Alert,
  Spinner,
} from "@heroui/react";
import { FiSend, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useParams } from "react-router-dom";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import {
  FormDataType,
  ContentType,
  QuestionType,
  FormTypeEnum,
} from "../../types/Form.types";
import { getGuestData } from "../../utils/publicFormUtils";
import "./RespondentForm.css";

interface FormResponse {
  questionId: string;
  response: ResponseValue;
}

interface RespondentFormProps {
  token?: string; // Optional token for secure forms
  isGuest?: boolean; // Whether user is accessing as guest
  guestData?: {
    name: string;
    email: string;
  };
}

interface RangeResponse {
  start: string;
  end: string;
}

type ResponseValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Date
  | RangeResponse;

const RespondentForm: React.FC<RespondentFormProps> = ({
  isGuest = false,
  guestData,
}) => {
  const { formId, token } = useParams<{ formId: string; token?: string }>();
  const [form, setForm] = useState<FormDataType | null>(null);
  const [questions, setQuestions] = useState<ContentType[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [respondentInfo, setRespondentInfo] = useState({
    name: guestData?.name || "",
    email: guestData?.email || "",
  });

  // For guest users, disable editing of name and email
  const isGuestMode = Boolean(isGuest && guestData);

  // Restore guest data from session storage if available
  useEffect(() => {
    if (isGuest && !guestData) {
      const storedGuestData = getGuestData();
      if (storedGuestData) {
        setRespondentInfo({
          name: storedGuestData.name || "",
          email: storedGuestData.email || "",
        });
      }
    }
  }, [isGuest, guestData]);

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) return;

      try {
        setLoading(true);
        const url = token
          ? `response/form/${formId}?token=${token}`
          : `response/form/${formId}`;

        const result = (await ApiRequest({
          url,
          method: "GET",
        })) as ApiRequestReturnType;

        if (result.success && result.data) {
          const formData = result.data as FormDataType & {
            contentIds: ContentType[];
          };
          setForm(formData);

          // Cast to ContentType array since the backend populates it
          const questions = (formData.contentIds || []) as ContentType[];
          setQuestions(questions);

          // Initialize responses
          const initialResponses = questions.map((q) => ({
            questionId: q._id || "",
            response: "",
          }));
          setResponses(initialResponses);
        } else {
          setError("Form not found or access denied");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, token]);

  // Apply form styling to document root
  useEffect(() => {
    if (form?.setting) {
      const root = document.documentElement;
      root.style.setProperty("--form-bg", form.setting.bg || "#ffffff");
      root.style.setProperty("--form-text", form.setting.text || "#000000");
      root.style.setProperty("--form-navbar", form.setting.navbar || "#f5f5f5");
      root.style.setProperty("--form-qcolor", form.setting.qcolor || "#e5e7eb");
    }

    // Cleanup on unmount
    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--form-bg");
      root.style.removeProperty("--form-text");
      root.style.removeProperty("--form-navbar");
      root.style.removeProperty("--form-qcolor");
    };
  }, [form?.setting]);

  // Update response
  const updateResponse = (questionId: string, value: ResponseValue) => {
    setResponses((prev) =>
      prev.map((r) =>
        r.questionId === questionId ? { ...r, response: value } : r
      )
    );
  };

  // Get current page questions
  const getCurrentPageQuestions = () => {
    return questions.filter((q) => q.page === currentPage);
  };

  // Check if current page is complete
  const isCurrentPageComplete = () => {
    const currentQuestions = getCurrentPageQuestions();
    return currentQuestions.every((q) => {
      const response = responses.find((r) => r.questionId === q._id);
      if (q.require) {
        return response && response.response && response.response !== "";
      }
      return true;
    });
  };

  // Submit form
  const handleSubmit = async () => {
    if (!form) return;

    // Validate required fields
    const requiredQuestions = questions.filter((q) => q.require);
    const missingResponses = requiredQuestions.filter((q) => {
      const response = responses.find((r) => r.questionId === q._id);
      return !response || !response.response || response.response === "";
    });

    if (missingResponses.length > 0) {
      setError("Please complete all required fields");
      return;
    }

    // Validate email for quiz forms
    if (form.type === FormTypeEnum.Quiz && !respondentInfo.email) {
      setError("Email is required for quiz forms");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = (await ApiRequest({
        url: "response/submit-response",
        method: "POST",
        data: {
          formId: form._id,
          responseset: responses.map((r) => ({
            questionId: r.questionId,
            response: r.response,
          })),
          guestEmail: respondentInfo.email || undefined,
          guestName: respondentInfo.name || undefined,
        },
      })) as ApiRequestReturnType;

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  // Render question based on type
  const renderQuestion = (question: ContentType) => {
    const response = responses.find((r) => r.questionId === question._id);
    const value = response?.response || "";

    switch (question.type) {
      case QuestionType.Text:
      case QuestionType.ShortAnswer:
        return (
          <Input
            placeholder="Enter your answer"
            value={value as string}
            onChange={(e) => updateResponse(question._id || "", e.target.value)}
            isRequired={question.require}
          />
        );

      case QuestionType.Paragraph:
        return (
          <Textarea
            placeholder="Enter your answer"
            value={value as string}
            onChange={(e) => updateResponse(question._id || "", e.target.value)}
            isRequired={question.require}
            minRows={3}
          />
        );

      case QuestionType.Number:
        return (
          <Input
            type="number"
            placeholder="Enter a number"
            value={value as string}
            onChange={(e) => updateResponse(question._id || "", e.target.value)}
            isRequired={question.require}
          />
        );

      case QuestionType.Date:
        return (
          <DatePicker
            value={null}
            onChange={(date) =>
              updateResponse(
                question._id || "",
                date ? new Date(date.toString()) : ""
              )
            }
            isRequired={question.require}
          />
        );

      case QuestionType.MultipleChoice:
        return (
          <RadioGroup
            value={value as string}
            onValueChange={(val) => updateResponse(question._id || "", val)}
            isRequired={question.require}
          >
            {question.multiple?.map((option, idx) => (
              <Radio key={idx} value={option.content}>
                {option.content}
              </Radio>
            ))}
          </RadioGroup>
        );

      case QuestionType.CheckBox:
        return (
          <CheckboxGroup
            value={value as string[]}
            onValueChange={(values) =>
              updateResponse(question._id || "", values)
            }
            isRequired={question.require}
          >
            {question.checkbox?.map((option, idx) => (
              <Checkbox key={idx} value={option.content}>
                {option.content}
              </Checkbox>
            ))}
          </CheckboxGroup>
        );

      case QuestionType.Selection:
        return (
          <Select
            placeholder="Select an option"
            selectedKeys={value ? [value as string] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              updateResponse(question._id || "", selected);
            }}
            isRequired={question.require}
          >
            {question.multiple?.map((option) => (
              <SelectItem key={option.content}>{option.content}</SelectItem>
            )) || []}
          </Select>
        );

      case QuestionType.RangeNumber:
        return (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min"
                value={value ? (value as RangeResponse).start : ""}
                onChange={(e) => {
                  const current = (value as RangeResponse) || {
                    start: "",
                    end: "",
                  };
                  updateResponse(question._id || "", {
                    ...current,
                    start: e.target.value,
                  });
                }}
                className="flex-1"
              />
              <span>to</span>
              <Input
                type="number"
                placeholder="Max"
                value={value ? (value as RangeResponse).end : ""}
                onChange={(e) => {
                  const current = (value as RangeResponse) || {
                    start: "",
                    end: "",
                  };
                  updateResponse(question._id || "", {
                    ...current,
                    end: e.target.value,
                  });
                }}
                className="flex-1"
              />
            </div>
          </div>
        );

      default:
        return (
          <Input
            placeholder="Enter your answer"
            value={value as string}
            onChange={(e) => updateResponse(question._id || "", e.target.value)}
            isRequired={question.require}
          />
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && !form) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert color="danger" title="Error">
          {error}
        </Alert>
      </div>
    );
  }

  // Check if form accepts responses
  if (form && form.setting?.acceptResponses === false) {
    return (
      <div className="max-w-2xl mx-auto p-6 respondent-form">
        <Card className="form-closed-card">
          <CardBody className="text-center p-8">
            <div className="text-orange-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold mb-4 form-closed-title">
              Form Closed
            </h2>
            <p className="form-closed-text mb-4">
              This form is no longer accepting responses.
            </p>
            <p className="text-sm form-closed-subtext">
              The form owner has disabled new submissions. Please contact them
              if you need to submit a response.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 respondent-form">
        <Card className="form-success-card">
          <CardBody className="text-center p-8">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4 form-success-title">
              Form Submitted Successfully!
            </h2>
            <p className="form-success-text mb-4">
              Thank you for your response. Your submission has been recorded.
            </p>
            {form?.type === "QUIZ" && (
              <p className="text-sm form-success-subtext">
                Results will be sent to your email address if scoring is
                enabled.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  const currentQuestions = getCurrentPageQuestions();
  const totalPages = Math.max(...questions.map((q) => q.page || 1));
  const progress = (currentPage / totalPages) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen respondent-form">
      {/* Form Header */}
      <Card className="mb-6 form-header-card">
        <CardHeader>
          <div className="w-full">
            <h1 className="text-3xl font-bold mb-2 form-title">{form.title}</h1>
            <Progress
              value={progress}
              className="mb-4"
              color="primary"
              size="sm"
            />
            <p className="text-sm form-progress-text">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Respondent Information (for quiz forms) */}
      {form.type === "QUIZ" && currentPage === 1 && (
        <Card className="mb-6 form-info-card">
          <CardHeader>
            <h2 className="text-xl font-semibold form-info-header">
              Your Information
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="Enter your name"
                value={respondentInfo.name}
                onChange={(e) =>
                  setRespondentInfo((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                isDisabled={isGuestMode}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={respondentInfo.email}
                onChange={(e) =>
                  setRespondentInfo((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                isDisabled={isGuestMode}
                isRequired
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {currentQuestions.map((question, index) => (
          <Card key={question._id} className="form-question-card">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="form-question-number rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                  {(currentPage - 1) * 10 + index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold form-question-title">
                    {typeof question.title === "string"
                      ? question.title
                      : "Question"}
                    {question.require && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  {question.score && (
                    <p className="text-sm form-question-subtitle">
                      Points: {question.score}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody>{renderQuestion(question)}</CardBody>
          </Card>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <Alert color="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="light"
          startContent={<FiChevronLeft />}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          isDisabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? "solid" : "light"}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>

        {currentPage < totalPages ? (
          <Button
            color="primary"
            endContent={<FiChevronRight />}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            isDisabled={!isCurrentPageComplete()}
          >
            Next
          </Button>
        ) : (
          <Button
            color="success"
            endContent={<FiSend />}
            onClick={handleSubmit}
            isLoading={submitting}
            isDisabled={!isCurrentPageComplete()}
          >
            Submit Form
          </Button>
        )}
      </div>
    </div>
  );
};

export default RespondentForm;
