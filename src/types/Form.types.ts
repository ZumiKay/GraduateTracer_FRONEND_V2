import { DateValue, RangeValue } from "@nextui-org/react";
import { RawDraftContentState } from "draft-js";

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
  title?: RawDraftContentState;
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
}

export const DefaultContentType: ContentType = {
  type: QuestionType.Text,
  formId: "",
  title: {
    blocks: [
      {
        key: "",
        text: "Header 1",
        type: "header-one",
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {},
      },
    ],
    entityMap: {},
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
