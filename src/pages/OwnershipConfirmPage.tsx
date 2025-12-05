import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import ApiRequest from "../hooks/ApiHook";

interface ConfirmOwnershipResponse {
  formId: string;
  formTitle: string;
  role: string;
}

type ConfirmStatus = "loading" | "success" | "error" | "expired" | "invalid";

const OwnershipConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const [message, setMessage] = useState<string>("");
  const [formData, setFormData] = useState<ConfirmOwnershipResponse | null>(
    null
  );

  const invite = searchParams.get("invite");

  const confirmMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await ApiRequest({
        method: "POST",
        url: "/ownership/confirm",
        data: { invite: inviteCode },
        cookie: true,
        reactQuery: true,
      });

      if (!response.success) {
        throw new Error(
          response.error || "Failed to confirm ownership transfer"
        );
      }

      return response.data as ConfirmOwnershipResponse;
    },
    onSuccess: (data) => {
      setFormData(data);
      setStatus("success");
      setMessage(
        `You are now the primary owner of "${data.formTitle}". The previous owner has been moved to the owners list.`
      );

      // Redirect to form after 3 seconds
      setTimeout(() => {
        navigate(`/form/${data.formId}`);
      }, 3000);
    },
    onError: (error: Error) => {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("expired")) {
        setStatus("expired");
        setMessage(
          "This ownership transfer invitation has expired. Please request a new one from the current owner."
        );
      } else if (
        errorMessage.includes("not found") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("no pending")
      ) {
        setStatus("invalid");
        setMessage(
          "This ownership transfer invitation is invalid or has already been completed."
        );
      } else if (errorMessage.includes("not for you")) {
        setStatus("error");
        setMessage(
          "This ownership transfer invitation was sent to a different account. Please login with the correct account."
        );
      } else {
        setStatus("error");
        setMessage(error.message || "Failed to confirm ownership transfer");
      }
    },
  });

  useEffect(() => {
    if (!invite) {
      setStatus("invalid");
      setMessage("No invitation code provided");
      return;
    }

    // Confirm the ownership transfer
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
                className="animate-spin h-12 w-12 text-purple-600"
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
              Confirming Ownership Transfer
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we process your ownership transfer...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              🎉 Ownership Transfer Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            {formData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Form</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.formTitle}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Your New Role
                </p>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  👑 {formData.role} (Primary Owner)
                </span>
              </div>
            )}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    What's changed?
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 list-disc list-inside">
                    <li>You now have full control over this form</li>
                    <li>
                      You can manage all collaborators and transfer ownership
                    </li>
                    <li>The previous owner is now listed as an owner</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Redirecting to form in 3 seconds...
            </p>
            <button
              onClick={handleRedirectToForm}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
              Transfer Invitation Expired
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                💡 Contact the form owner to request a new ownership transfer
                invitation.
              </p>
            </div>
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
              Invalid Transfer Invitation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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

export default OwnershipConfirmPage;
