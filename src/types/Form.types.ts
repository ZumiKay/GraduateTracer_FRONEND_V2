import { DateValue, RangeValue } from "@heroui/react";
import { Content, JSONContent } from "@tiptap/react";
import {
  AnswerKeyPairValueType,
  SubmittionProcessionReturnType,
} from "../component/Response/Response.type";

// Form Enums

export const formDatePattern = "yyyy-MM-dd";

export enum FormTypeEnum {
  Normal = "NORMAL",
  Quiz = "QUIZ",
}
export enum Tiptapcontent_Enum {
  doc = "doc",
  text = "text",
  paragraph = "paragraph",
  heading = "heading",
  bulletlist = "bulletPointj",
}

export enum CollaboratorType {
  owner = "OWNER",
  editor = "EDITOR",
  creator = "CREATOR",
}

export enum CollaborateActionType {
  add = "add",
  remove = "remove",
}

export type FormType = `${FormTypeEnum}`;

// Submit Types
export enum SubmitType {
  Once = "ONCE",
  Multiple = "MULTIPLE",
}
export enum returnscore {
  partial = "PARTIAL",
  manual = "MANUAL",
}
export interface FormSettingType {
  submitonce?: boolean;
  qcolor?: string;
  bg?: string;
  navbar?: string;
  text?: string;
  email?: boolean;
  returnscore?: returnscore;
  autosave?: boolean;
  acceptResponses?: boolean;
  acceptGuest?: boolean;
}

interface User {
  _id: string;
  email: string;
  role: string;
}

// Form Data Type
export interface FormDataType {
  _id?: string;
  title: string;
  type: FormType;
  contentIds: Array<string>;
  contents?: Array<ContentType>;
  setting?: FormSettingType;
  user?: User;
  owners?: Array<string>;
  editors?: Array<string>;
  totalpage: number;
  totalscore?: number;
  createdAt?: Date;
  updatedAt?: Date;
  responses?: Array<FormResponseType>;
  submittedResult?: SubmittionProcessionReturnType;
  isOwner?: boolean;
  isCreator?: boolean;
  isEditor?: boolean;
  isCollaborator?: boolean;

  formType?: string; // Represents which dashboard tab this form belongs to
  lastqIdx?: number;

  //Helper types
  isFilled?: boolean;
  isAuthenticated?: boolean;
  isLoggedIn?: boolean;
}

// Question Types
export enum QuestionType {
  MultipleChoice = "multiple",
  CheckBox = "checkbox",
  Text = "texts",
  Number = "number",
  Date = "date",
  RangeDate = "rangedate",
  Selection = "selection",
  RangeNumber = "rangenumber",
  ShortAnswer = "shortanswer",
  Paragraph = "paragraph",
}

// Range Type
export interface RangeType<t> {
  start: t;
  end: t;
}

// Choice Question Type
export interface ChoiceQuestionType {
  idx: number;
  content: string;
}

// Answer Key
export interface AnswerKey {
  _id?: string;
  answer:
    | string
    | number
    | Date
    | RangeType<Date>
    | RangeType<DateValue>
    | RangeType<number>
    | Array<number>;
  isCorrect?: boolean;
}

// Conditional Type
export interface ConditionalType {
  _id?: string;
  contentId?: string;
  contentIdx?: number;
  key?: number;
}

export interface ParentContentType {
  _id?: string;
  qId?: string;
  qIdx?: number;
  optIdx: number;
}

// Content Type
export interface ContentType<t = unknown> {
  _id?: string;
  title?: JSONContent | Content;
  qIdx: number;
  type: QuestionType;
  formId: string;
  text?: string;
  checkbox?: Array<ChoiceQuestionType>;
  multiple?: Array<ChoiceQuestionType>;
  rangedate?: RangeValue<string>;
  rangenumber?: RangeType<number>;
  selection?: Array<ChoiceQuestionType>;
  parentcontent?: ParentContentType;
  date?: string;
  score?: number;
  answer?: AnswerKey | AnswerKeyPairValueType[] | AnswerKeyPairValueType;
  conditional?: Array<ConditionalType>;
  require?: boolean;
  page?: number;
  hasAnswer?: boolean;
  isValidated?: boolean;
  //Helper Field
  isFilled?: boolean;
  [key: string]: t | unknown;
}

export const DefaultContentType: ContentType = {
  type: QuestionType.Text,
  formId: "",
  page: 1,
  qIdx: 0,
  title: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: {
          level: 1,
        },
        content: [
          {
            type: "text",
            text: "Hello this is header 1",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This is a paragraph below the header.",
          },
        ],
      },
    ],
  },
};

// Form Setting Data Type
export interface FormSetiingDataType {
  question: string;
  background: string;
  navbar: string;
  text: string;
  response: boolean;
  email: boolean;
}

//Response Form Type
export interface ResponseSetType {
  questionId?: string;
  response:
    | string
    | number
    | boolean
    | RangeType<number>
    | RangeType<Date>
    | Date
    | AnswerKeyPairValueType;
  score?: number;
  isManuallyScored?: boolean;
  question: ContentType;
}

export interface FormResponseType {
  _id?: string;
  formId: string;
  userId: string;
  responseset: Array<ResponseSetType>;
  returnscore?: returnscore;
  createdAt?: Date;
  updatedAt?: Date;
}

// Default Form Setting

export const BgColorTemplate = {
  Color1: "#A1E3F9",
  Color2: "#F8F3D9",
  Color3: "#C7DB9C",
  Color4: "#F8E7F6",
  Color5: "#FFF2C2",
  Color6: "#F8F5E9",
};

export const DefaultFormSetting: FormSettingType = {
  qcolor: BgColorTemplate.Color1,
  bg: BgColorTemplate.Color2,
  navbar: "#f5f5f5",
  text: "#000000",
  submitonce: false,
  email: false,
  autosave: false,
  acceptResponses: true,
  // returnscore is not set by default - only added for quiz types
};

// Function to get default settings based on form type
export const getDefaultFormSetting = (formType: FormType): FormSettingType => {
  const baseSettings = { ...DefaultFormSetting };

  if (formType === FormTypeEnum.Quiz) {
    baseSettings.returnscore = returnscore.manual;
  }

  return baseSettings;
};

export const DefaultFormState: FormDataType = {
  title: "",
  type: FormTypeEnum.Normal,
  totalpage: 0,
  contentIds: [],
  setting: getDefaultFormSetting(FormTypeEnum.Normal),
};

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingAnswers: string[];
  missingScores: string[];
}

export interface FormValidationSummary {
  canReturnScoreAutomatically: boolean;
  totalValidQuestions: number;
  totalInvalidQuestions: number;
  totalScore: number;
  validationResults: ValidationResult[];
  errors?: string[];
  warnings?: string[];
  canProceed?: boolean;
  canSubmit?: boolean;
  action?: string;
}
