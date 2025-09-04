import { ContentType } from "../../types/Form.types";
import { FormResponse } from "./hooks/useFormResponses";

/* Response Related Types */

export type statusColor = "success" | "warning" | "danger" | "default";
export type ResponseValueType =
  | string
  | number
  | boolean
  | Array<string>
  | Array<number>
  | Array<AnswerKeyPairValueType>
  | AnswerKeyPairValueType;

export interface AnswerKeyPairValueType {
  key: number | number[];
  val: string | string[];
}

export interface RespondentInfoType {
  email: string;
  name?: string;
}
export interface SaveProgressType {
  currentPage: number;
  responses: FormResponse[];
  respondentInfo?: RespondentInfoType;
  timestamp: string;
  formId: string;
  version: string;
  [x: string]: unknown | undefined;
}

export interface ResponseSetType {
  _id: string;
  question: ContentType;
  response: ResponseValueType;
  score?: number;
  isManuallyScored?: boolean;
}

export enum ResponseCompletionStatus {
  completed = "completed",
  partial = "partial",
  abandoned = "abandoned",
}

export interface ResponseDataType {
  _id: string;
  formId: string;
  userId?: string;
  guest?: {
    email: string;
    name?: string;
  };
  respondentEmail?: string;
  respondentName?: string;
  totalScore?: number;
  completionStatus?: ResponseCompletionStatus;
  submittedAt?: Date;
  isManuallyScored?: boolean;
  responseset: ResponseSetType[];
  isCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface RespondentSessionType  {
  isActive: boolean , 
  isSwitchedUser: boolean
  session_id?: string 
  alert?: boolean
  respondentinfo?: RespondentInfoType
}