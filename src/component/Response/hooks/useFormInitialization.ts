import { useEffect, useState } from "react";
import { RootState } from "../../../redux/store";
import { FormAction, FormState } from "../types/PublicFormAccessTypes";
import useFormsessionAPI from "../../../hooks/useFormsessionAPI";
import { generateStorageKey } from "../../../helperFunc";
import { RespondentSessionType } from "../Response.type";

const useFormInitialization = ({
  formId,
  dispatch,
  formstate,
}: {
  formId: string | undefined;
  user: RootState["usersession"];
  dispatch: React.Dispatch<FormAction>;
  formstate: FormState;
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { useSessionVerification } = useFormsessionAPI();

  const sessionVerificationEnabled = Boolean(formId);
  const verifiedSession = useSessionVerification(
    Boolean(sessionVerificationEnabled),
    formId,
  );

  useEffect(() => {
    console.log("Form initialized");
    const initializeForm = async () => {
      setIsInitializing(true);
      setIsInitialized(false);

      try {
        if (!formId) {
          setIsInitialized(true);
          return;
        }

        if (
          verifiedSession.isLoading ||
          verifiedSession.isFetching ||
          !dispatch
        ) {
          return;
        }

        if (
          verifiedSession.data?.data &&
          !verifiedSession.data.data.isNormalForm
        ) {
          //Initialize storage key for form session
          const key = generateStorageKey({
            suffix: "state",
            userKey: verifiedSession.data.data.respondentEmail,
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
              respondentinfo: verifiedSession.data.data,
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
        if (!verifiedSession.isLoading && !verifiedSession.isFetching) {
          setIsInitializing(false);
        }
      }
    };

    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formId,
    verifiedSession.isLoading,
    verifiedSession.isFetched,
    verifiedSession.isFetching,
    verifiedSession.data?.data,
  ]);

  return {
    isInitialized,
    isInitializing,
    sessionVerificationLoading:
      verifiedSession.isLoading || verifiedSession.isFetching,
    sessionVerificationError: verifiedSession.error,
    sessionData: verifiedSession.data,
  };
};

export default useFormInitialization;
