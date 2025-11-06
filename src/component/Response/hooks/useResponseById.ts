import { useState } from "react";
import { PaginationType } from "../../../services/responseService";
import { ResponseDataType } from "../Response.type";
import { useQuery } from "@tanstack/react-query";
import ApiRequest from "../../../hooks/ApiHook";

interface useResponseByIdType {
  responses: ResponseDataType[];
  pagination: PaginationType;
}

export interface UniqueRespondentType {
  respondentEmail: string;
  respondentName?: string;
  respondentType?: string;
  responseCount?: number;
  lastSubmitted?: Date;
}

const useResponseById = (data: {
  formId: string;
  respondentEmail: string;
  page: number;
}) => {
  const [responseData, setResponseData] = useState<useResponseByIdType>();

  //Fetch data
  const { isLoading, error, refetch } = useQuery({
    queryKey: [
      "responses-by-email",
      data.formId,
      data.respondentEmail,
      data.page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("formId", data.formId);
      params.set("respondentEmail", data.respondentEmail);
      params.set("page", data.page.toString());

      const makeReq = await ApiRequest({
        url: `/response/getuserresponses?${params.toString()}`,
        method: "GET",
        cookie: true,
        refreshtoken: true,
        reactQuery: true,
      });

      if (!makeReq.success) {
        throw new Error(makeReq.error);
      }

      setResponseData(makeReq.data as useResponseByIdType);
      return makeReq.data;
    },
    staleTime: 30000,
    enabled: !!(data.formId && data.respondentEmail),
  });

  return { responseData, setResponseData, isLoading, error, refetch };
};

export default useResponseById;
/**
Get list of respondents
@params formId:string
*/
export const useGetAllUniqueRespondent = (formId: string) => {
  const [uniqueRespondents, setUniqueRespondents] =
    useState<UniqueRespondentType[]>();

  const { isLoading, error, refetch } = useQuery({
    queryKey: ["unique-respondents", formId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("formId", formId);

      const makeReq = await ApiRequest({
        url: `/response/getrespondents?${params.toString()}`,
        method: "GET",
        cookie: true,
        refreshtoken: true,
        reactQuery: true,
      });

      if (!makeReq.success) {
        throw new Error(makeReq.error);
      }

      setUniqueRespondents(makeReq.data as UniqueRespondentType[]);
      return makeReq.data;
    },
    staleTime: 60000, // Cache for 1 minute since respondent list doesn't change frequently
    enabled: !!formId,
  });

  return {
    uniqueRespondents,
    setUniqueRespondents,
    isLoading,
    error,
    refetch,
  };
};
