import { DateValue, RangeValue } from "@nextui-org/react";
import { JSONContent } from "@tiptap/react";

// Form Types
export enum FormTypeEnum {
  Normal = "NORMAL",
  Quiz = "QUIZ",
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
  createdAt?: Date;
  updatedAt?: Date;
  responses?: Array<FormResponseType>;
}

// Question Types
export enum QuestionType {
  MultipleChoice = "multiple",
  CheckBox = "checkbox",
  Text = "texts",
  Number = "number",
  Date = "date",
  RangeDate = "rangedate",
  Selection = "select",
  RangeNumber = "rangenumber",
}

// Range Type
export interface RangeType<t> {
  start: t;
  end: t;
}

// Checkbox Question Type
export interface CheckboxQuestionType {
  idx: number;
  content: string;
}

// Answer Key
export interface AnswerKey {
  _id: string;
  answer:
    | string
    | number
    | Date
    | RangeType<Date>
    | RangeType<number>
    | Array<number>;
}

// Conditional Type
export interface ConditionalType {
  _id?: string;
  QuestionIds: Array<number>;
  key: Array<number>;
}

// Content Type
export interface ContentType {
  _id?: string;
  title?: JSONContent;
  type: QuestionType;
  formId: string;
  text?: string;
  checkbox?: Array<CheckboxQuestionType>;
  multiple?: Array<CheckboxQuestionType>;
  range?: RangeValue<DateValue>;
  numrange?: RangeType<number>;
  date?: Date;
  score?: number;
  answer?: AnswerKey;
  parent_question?: number | string;
  parentanswer_idx?: number;
  conditional?: ConditionalType;
  require?: boolean;
  selection?: Array<string>;
  page?: number;
}

export const DefaultContentType: ContentType = {
  type: QuestionType.Text,
  formId: "",
  page: 1,
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
    | Date;
  score?: number;
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
export const DefaultFormSetting: FormSettingType = {
  qcolor: "#D3F1DF",
  bg: "#ffffff",
  navbar: "#f5f5f5",
  text: "#000000",
  submitonce: false,
  returnscore: returnscore.manual,
  email: false,
};

export const DefaultFormState: FormDataType = {
  title: "",
  type: FormTypeEnum.Normal,
  contentIds: [],
  setting: DefaultFormSetting,
};
