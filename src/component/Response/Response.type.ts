import { DateValue, RangeValue } from "@heroui/react";
import { ContentType } from "../../types/Form.types";
import { FormResponse } from "./hooks/useFormResponses";
import { respondentType } from "../../services/responseService";
import { SelectionType } from "../../types/Global.types";

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

export type ContentAnswerType =
  | string
  | number
  | RangeValue<DateValue>
  | RangeValue<string>
  | RangeValue<number>
  | RangeValue<string | null>
  | Array<number>;

export interface AnswerKeyPairValueType {
  key: number | number[];
  val: string | string[];
}

export interface RespondentInfoType {
  respondentEmail: string;
  respondentName?: string;
  isGuest?: boolean;
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
  comment?: string;
  isManuallyScored?: boolean;
  scoringMethod?: ScoringMethod;
}

export enum ResponseCompletionStatus {
  completed = "completed",
  noscore = "noscore",
  notreturn = "notreturn",
  autoscore = "autoscore",
  partial = "partial",
  abandoned = "abandoned",
  submitted = "submitted",
}

export enum ScoringMethod {
  AUTO = "auto",
  MANUAL = "manual",
  NONE = "none",
}

export interface ResponseDataType {
  _id: string;
  formId: string;
  userId?: string;
  respondentEmail?: string;
  respondentName?: string;
  totalScore?: number;
  scoringMethod: ScoringMethod;
  completionStatus?: ResponseCompletionStatus;
  submittedAt?: Date;
  respondentType?: respondentType;
  responseset: ResponseSetType[];
  isCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RespondentSessionType {
  isActive: boolean;
  session_id?: string;
  alert?: boolean;
  respondentinfo?: RespondentInfoType;
}

export interface SubmittionProcessionReturnType {
  maxScore: number;
  totalScore: number;
  message: string;
  responseId?: string;
  respondentEmail?: string;
  isComplete?: boolean;
  isNonScore?: boolean;
}

export interface ResponseDashboardFilterType {
  searchTerm?: string;
  dateRange?: RangeValue<DateValue | undefined>;
  scoreRange?: RangeValue<number | undefined>;
  completionStatus?: ResponseCompletionStatus;
}
export const ResponseStatusOpt: Array<SelectionType<ResponseCompletionStatus>> =
  [
    {
      label: "Completed",
      value: ResponseCompletionStatus.completed,
    },
    {
      label: "Auto-Scored",
      value: ResponseCompletionStatus.autoscore,
    },
    {
      label: "No Score",
      value: ResponseCompletionStatus.noscore,
    },
    {
      label: "No Return",
      value: ResponseCompletionStatus.notreturn,
    },

    {
      label: "Partial",
      value: ResponseCompletionStatus.partial,
    },
    { label: "Abandoned", value: ResponseCompletionStatus.abandoned },
  ];

export const ResponseShowPerPage: Array<SelectionType<string>> = [
  5, 10, 20, 50,
].map((i) => ({ label: i.toString(), value: i.toString() }));
