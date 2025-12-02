import ApiRequest from "../hooks/ApiHook";
import { ResponseDataType } from "../component/Response/Response.type";

export enum responseCompletionStatus {
  completed = "completed",
  partial = "partial",
  abandoned = "abandoned",
}

export enum respondentType {
  guest = "GUEST",
  user = "USER",
}

export interface ResponseListItem {
  _id: string;
  formId: string;
  userId?: string;
  respondentEmail?: string;
  respondentName?: string;
  respondentType?: respondentType;
  responseCount?: number;
  totalScore?: number;
  completionStatus?: responseCompletionStatus;
  submittedAt?: Date;
  isManuallyScored?: boolean;
  isCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GroupResponseListItemType {
  respondentEmail?: string;
  respondentName?: string;
  respondentType?: respondentType;
  responseCount?: number;
  responseIds?: Array<string>;
}

export interface PaginationType {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface ResponseListResponse {
  responses: ResponseListItem[] | GroupResponseListItemType[];
  pagination: PaginationType;
}

/**
 * Fetch response list without responseset data for table display
 */
interface fetchResponseListParamType {
  formId: string;
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  minScore?: string;
  maxScore?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  completionStatus?: string;
  group?: string; // Add group parameter
}
export const fetchResponseList = async ({
  formId,
  page,
  limit,
  search,
  startDate,
  endDate,
  minScore,
  maxScore,
  sortBy,
  sortOrder,
  completionStatus,
  group,
  ...rest
}: fetchResponseListParamType): Promise<ResponseListResponse> => {
  const params = new URLSearchParams({
    formId,
    p: page.toString(),
    lt: limit.toString(),
  });

  // Add filter parameters using the backend's expected parameter names
  if (search) params.set("q", search);
  if (completionStatus) params.set("status", completionStatus);
  if (startDate) params.set("startD", startDate);
  if (endDate) params.set("endD", endDate);
  if (minScore) params.set("startS", minScore);
  if (maxScore) params.set("endS", maxScore);
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);
  if (group) params.set("group", group); // Add group parameter

  // Add any remaining parameters
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const result = await ApiRequest({
    url: `/response/getresponselist?${params}`,
    method: "GET",
    cookie: true,
    reactQuery: true,
  });

  if (!result.success) {
    throw new Error(result.error ?? "Error occured");
  }

  return result.data as ResponseListResponse;
};

export const fetchUserResponse = async (data: {
  uid: string;
  formId: string;
  page: string;
  limit?: string;
}) => {
  const searchParam = new URLSearchParams();

  //Create search param
  Object.entries(data).map(([key, val]) => searchParam.set(key, val));

  const makeReq = await ApiRequest({
    url: "/response/getuserresponses" + `?${searchParam}`,
    method: "GET",
    cookie: true,
    reactQuery: true,
  });

  if (!makeReq.success) {
    throw new Error(makeReq.error ?? "Error occured");
  }
  return makeReq.data;
};

export const fetchResponseDetails = async (
  responseId: string,
  formId: string
): Promise<ResponseDataType> => {
  const result = await ApiRequest({
    url: `response/getresponseById/${responseId}/${formId}`,
    method: "GET",
    cookie: true,
    reactQuery: true,
  });

  return result.data as ResponseDataType;
};

export const updateResponseScores = async (
  responseId: string,
  scores: Array<{ questionId: string; score: number }>,
  sendEmail: boolean = false
) => {
  const result = await ApiRequest({
    url: "/updateresponsescore",
    method: "PUT",
    cookie: true,
    data: {
      responseId,
      scores,
      sendEmail,
    },
  });

  return result;
};

export const deleteResponse = async (responseId: string) => {
  const result = await ApiRequest({
    url: `/deleteresponse/${responseId}`,
    method: "DELETE",
    cookie: true,
  });

  return result;
};

export const bulkDeleteResponses = async (
  responseIds: string[],
  formId: string
) => {
  const result = await ApiRequest({
    url: "/bulkdeleteresponses",
    method: "DELETE",
    cookie: true,
    data: {
      responseIds,
      formId,
    },
  });

  return result;
};
