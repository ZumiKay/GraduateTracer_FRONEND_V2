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

// Form Data Type
export interface FormDataType {
  _id: string;
  title: string;
  type: FormType;
  contentIds: Array<string>;
  contents?: Array<ContentType>;
  submittype: SubmitType;
  user: string;
  createdAt?: Date;
  updatedAt?: Date;
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

// Default Form Setting
export const DefaultFormSetting: FormSetiingDataType = {
  question: "#D3F1DF",
  background: "#ffffff",
  navbar: "#f5f5f5",
  text: "#000000",
  response: false,
  email: false,
};
