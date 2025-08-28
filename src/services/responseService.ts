import ApiRequest from "../hooks/ApiHook";
import { ResponseDataType } from "../component/Response/Response.type";

export interface ResponseListItem {
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
  completionStatus?: "completed" | "partial" | "abandoned";
  submittedAt?: Date;
  isManuallyScored?: boolean;
  isCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResponseListResponse {
  responses: ResponseListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Fetch response list without responseset data for table display
 */
export const fetchResponseList = async (
  formId: string,
  page: number = 1,
  limit: number = 10
): Promise<ResponseListResponse> => {
  const params = new URLSearchParams({
    id: formId,
    p: page.toString(),
    lt: limit.toString(),
  });

  const result = await ApiRequest({
    url: `/getresponsebyform?${params}`,
    method: "GET",
    cookie: true,
    refreshtoken: true,
    reactQuery: true,
  });

  return result.data as ResponseListResponse;
};

export const fetchResponseDetails = async (
  responseId: string,
  formId: string
): Promise<ResponseDataType> => {
  const params = new URLSearchParams({
    userId: responseId,
    formId: formId,
  });

  const result = await ApiRequest({
    url: `response/getbyuserid?${params}`,
    method: "GET",
    cookie: true,
    refreshtoken: true,
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
    refreshtoken: true,
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
    refreshtoken: true,
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
    refreshtoken: true,
    data: {
      responseIds,
      formId,
    },
  });

  return result;
};
