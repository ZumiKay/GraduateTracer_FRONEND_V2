import { useEffect, useState } from "react";
import { FormAction } from "../types/PublicFormAccessTypes";
import { generateStorageKey } from "../../../helperFunc";
import { RespondentInfoType, RespondentSessionType } from "../Response.type";
import { useQuery } from "@tanstack/react-query";
import ApiRequest from "../../../hooks/APIHook/ApiHook";

const useFormInitialization = ({
  formId,
  dispatch,
}: {
  formId: string | undefined;
  dispatch: React.Dispatch<FormAction>;
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const verifiedSession = useQuery({
    queryKey: ["SessionVerifcation", formId],
    queryFn: () =>
      ApiRequest({
        method: "GET",
        url: "/response/verifyformsession/" + formId,
        reactQuery: true,
        cookie: true,
        skipRefresh: true,
      }),
    staleTime: 5 * 60 * 60, //5 minutes stale
    retry: false,
    networkMode: "online",
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const initializeForm = async () => {
      setIsInitializing(true);
      setIsInitialized(false);

      try {
        if (!formId) {
          setIsInitialized(true);
          return;
        }

        if (verifiedSession.isLoading || !dispatch) {
          return;
        }

        const verifiedData = verifiedSession.data?.data as RespondentInfoType;

        if (verifiedData) {
          //Initialize storage key for form session
          const key = generateStorageKey({
            suffix: "state",
            userKey: verifiedData.respondentEmail,
            formId: formId,
          });

          const savedData = localStorage.getItem(key);
          if (savedData) {
            try {
              const parsed = JSON.parse(
                savedData,
              ) as Partial<RespondentSessionType>;
              dispatch({
                type: "SET_FORMSESSION",
                payload: parsed,
              });
            } catch (error) {
              console.error("Error parsing saved data:", error);
              localStorage.removeItem(key);
            }
          } else {
            //*If no formsession state exist
            const defaultSession: RespondentSessionType = {
              isActive: true,
              respondentinfo: verifiedData,
            };
            dispatch({
              type: "SET_FORMSESSION",
              payload: defaultSession,
            });

            localStorage.setItem(key, JSON.stringify(defaultSession));
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Form initialization error:", error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      } finally {
        if (!verifiedSession.isLoading) {
          setIsInitializing(false);
        }
      }
    };

    initializeForm();
  }, [dispatch, formId, verifiedSession.data?.data, verifiedSession.isLoading]);

  return {
    isInitialized,
    isInitializing,
    sessionVerificationLoading: verifiedSession.isPending,
    sessionVerificationError: verifiedSession.error,
    sessionData: verifiedSession.data,
  };
};

export default useFormInitialization;
