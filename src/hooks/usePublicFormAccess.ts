import { useMutation } from "@tanstack/react-query";
import { generateStorageKey } from "../helperFunc";
import ApiRequest from "./ApiHook";
import { LoginData } from "../types/PublicFormAccess.types";

// Login hook
export const useLogin = () => {
  return useMutation({
    mutationFn: async ({
      loginData,
      isGuest,
    }: {
      loginData: LoginData;
      isGuest?: boolean;
    }) => {
      const result = await ApiRequest({
        url: "respondent/login",
        method: "POST",
        data: { ...loginData, isGuest },
      });

      if (!result.success) {
        throw new Error(result.error || "Invalid credentials");
      }

      return result;
    },
  });
};

// Switch user hook
export const useSwitchUser = () => {
  return useMutation({
    mutationFn: async (data: {
      isGuest?: boolean;
      formId?: string;
      userKey?: string;
    }) => {
      const { isGuest = false, formId, userKey } = data;

      if (isGuest) {
        // Clear guest data from localStorage
        localStorage.removeItem("guestData");
      } else if (formId && userKey) {
        // Clear form session data
        const key = generateStorageKey({
          suffix: "state",
          userKey: userKey,
          formId: formId,
        });
        localStorage.removeItem(key);
      }

      const result = await ApiRequest({
        url: "respondent/logout",
        method: "DELETE",
        cookie: true,
        reactQuery: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Logout failed");
      }

      return result;
    },
  });
};

// Check respondent session hook
export const useCheckRespondentSession = (
  formId: string | undefined,
  userEmail: string | undefined
) => {
  return useMutation({
    mutationFn: async () => {
      if (!formId || !userEmail) {
        throw new Error("Form ID and user email are required");
      }

      const result = await ApiRequest({
        url: `form/respondent/session/${formId}`,
        method: "GET",
        cookie: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Session check failed");
      }

      return result.data;
    },
  });
};
