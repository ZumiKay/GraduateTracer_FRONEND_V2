// Components
export { FormHeader } from "./components/FormHeader";
export { RespondentInfo } from "./components/RespondentInfo";
export { ConditionalIndicator } from "./components/ConditionalIndicator";
export { CheckboxQuestion } from "./components/CheckboxQuestion";
export { MultipleChoiceQuestion } from "./components/MultipleChoiceQuestion";
export { Navigation } from "./components/Navigation";
export { FormStateCard } from "./components/FormStateCard";

// Hooks
export { useFormData } from "./hooks/useFormData";
export { useFormResponses } from "./hooks/useFormResponses";
export { useFormValidation } from "./hooks/useFormValidation";
export type { FormResponse, ResponseValue } from "./hooks/useFormResponses";

// Utils
export {
  createValidationSummary,
  logValidationSummary,
} from "./utils/validationUtils";
export {
  testConditionalLogic,
  validateSubmissionData,
} from "./utils/testUtils";
export type { ValidationSummary } from "./utils/validationUtils";
export type { ConditionalTestCase } from "./utils/testUtils";

// Main component
export { default as RespondentForm } from "./RespondentForm";
