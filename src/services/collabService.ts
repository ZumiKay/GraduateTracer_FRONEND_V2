import ApiRequest from "../hooks/APIHook/ApiHook";

// The server drops a lock that isn't refreshed for 30s; refresh well inside that
export const LOCK_REFRESH_MS = 10_000;

const lockRequest = (
  action: "lock" | "unlock",
  formId: string,
  connectionId: string,
  questionId: string,
) =>
  ApiRequest({
    url: `/form/${formId}/collab/${action}`,
    method: "POST",
    cookie: true,
    data: { connectionId, questionId },
  });

/** Take or refresh the editing lock on a question. False when someone else holds it. */
export const acquireQuestionLock = async (
  formId: string,
  connectionId: string,
  questionId: string,
): Promise<boolean> => {
  const response = await lockRequest("lock", formId, connectionId, questionId);
  return response.success;
};

export const releaseQuestionLock = (
  formId: string,
  connectionId: string,
  questionId: string,
) => lockRequest("unlock", formId, connectionId, questionId);
