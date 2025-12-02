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
  resId: string;
  page: number;
}) => {
  const [responseData, setResponseData] = useState<useResponseByIdType>();

  //Fetch data
  const { isLoading, error, refetch } = useQuery({
    queryKey: ["responses-by-email", data.formId, data.page],
    queryFn: async () => {
      const makeReq = await ApiRequest({
        url: `/response/getuserresponses/${data.formId}/${data.resId}/${data.page}`,
        method: "GET",
        cookie: true,
        reactQuery: true,
      });

      if (!makeReq.success) {
        throw new Error(makeReq.error);
      }

      setResponseData(makeReq.data as useResponseByIdType);
      return makeReq.data;
    },
    staleTime: 30000,
    enabled: !!data.formId,
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
      const makeReq = await ApiRequest({
        url: `/response/getrespondents/${formId}`,
        method: "GET",
        cookie: true,
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
