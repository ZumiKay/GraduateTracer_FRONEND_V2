import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import ApiRequest from "../hooks/ApiHook";
import { CollaboratorType } from "../types/Form.types";

interface ConfirmCollaboratorResponse {
  formId: string;
  formTitle: string;
  role: CollaboratorType;
}

type ConfirmStatus = "loading" | "success" | "error" | "expired" | "invalid";

const CollaboratorConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const [message, setMessage] = useState<string>("");
  const [formData, setFormData] = useState<ConfirmCollaboratorResponse | null>(
    null
  );

  const invite = searchParams.get("invite");

  const confirmMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await ApiRequest({
        method: "POST",
        url: "/collaborator/confirm",
        data: { invite: inviteCode },
        cookie: true,
        reactQuery: true,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to confirm collaboration");
      }

      return response.data as ConfirmCollaboratorResponse;
    },
    onSuccess: (data) => {
      setFormData(data);
      setStatus("success");
      setMessage(`You have been added as ${data.role} to "${data.formTitle}"`);

      // Redirect to form after 3 seconds
      setTimeout(() => {
        navigate(`/form/${data.formId}`);
      }, 3000);
    },
    onError: (error: Error) => {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("expired")) {
        setStatus("expired");
        setMessage("This invitation has expired. Please request a new one.");
      } else if (
        errorMessage.includes("not found") ||
        errorMessage.includes("invalid")
      ) {
        setStatus("invalid");
        setMessage("This invitation is invalid or has already been used.");
      } else if (errorMessage.includes("not for you")) {
        setStatus("error");
        setMessage(
          "This invitation was sent to a different account. Please login with the correct account."
        );
      } else {
        setStatus("error");
        setMessage(error.message || "Failed to confirm collaboration");
      }
    },
  });

  useEffect(() => {
    if (!invite) {
      setStatus("invalid");
      setMessage("No invitation code provided");
      return;
    }

    // Confirm the collaboration
    confirmMutation.mutate(invite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite]);

  const handleRedirectToForm = () => {
    if (formData?.formId) {
      navigate(`/form/${formData.formId}`);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToLogin = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        {/* Loading State */}
        {status === "loading" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
              <svg
                className="animate-spin h-12 w-12 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Confirming Invitation
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we process your invitation...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invitation Accepted!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            {formData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Form</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.formTitle}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Role
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    formData.role === CollaboratorType.owner
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {formData.role}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Redirecting to form in 3 seconds...
            </p>
            <button
              onClick={handleRedirectToForm}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Form Now
            </button>
          </div>
        )}

        {/* Expired State */}
        {status === "expired" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invitation Expired
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Invalid State */}
        {status === "invalid" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something Went Wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleGoToLogin}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Login with Different Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorConfirmPage;
