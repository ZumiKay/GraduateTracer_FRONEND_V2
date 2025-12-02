export interface SelectionType<t> {
  label: string;
  value: t;
  description?: string;
}

export interface ShowLinkedQuestionType {
  question: number | string;
  show?: boolean;
}

export enum DashboardTabType {
  all = "all",
  filledform = "filledForm",
  myform = "myForm",
  otherform = "otherForm",
}

export interface DashboardFilterType {
  q?: string;
  created?: string;
  updated?: string;
}

export interface ResponseDashboardFilterParam {
  startD?: string;
  endD?: string;
  startS?: string;
  endS?: string;
  status?: string;
  q?: string;
}
