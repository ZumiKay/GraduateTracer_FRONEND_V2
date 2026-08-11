import React from "react";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import { FiUser, FiUserCheck } from "react-icons/fi";
import { LoginForm } from "./LoginForm";
import { GuestForm } from "./GuestForm";
import { LoginData } from "../../types/PublicFormAccess.types";
import { FormAction } from "./types/PublicFormAccessTypes";
import { SessionState } from "../../redux/user.store";
import { ApiError } from "../../hooks/APIHook/ApiHook";

export type onLoginFuncType = (
  e?: SubmitEvent,
  addition?: { existed: "1" },
) => Promise<void>;

interface AuthContainerProps {
  formTitle?: string;
  showGuestForm: boolean;
  loginData: LoginData;
  isLoginLoading: boolean;
  user: SessionState;
  updateLoginState: React.Dispatch<FormAction>;
  onLogin: onLoginFuncType;
  error?: ApiError;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  formTitle,
  showGuestForm,
  loginData,
  isLoginLoading,
  user,
  updateLoginState,
  onLogin,
  error,
}) => {
  return (
    <div className="w-full min-h-screen  dark:bg-gray-700 light:bg-gradient-to-br light:from-slate-50 light:via-blue-50 light:to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/95 shadow-xl border-0">
          <CardHeader className="text-center pb-4 pt-8">
            <div className="w-full flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FiUser className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl opacity-20 blur-sm"></div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {formTitle || "Form Access"}
                </h1>
                <p className="text-gray-500 text-sm">
                  Please sign in to continue
                </p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="pt-0 pb-8 px-8">
            {!showGuestForm ? (
              <>
                <LoginForm
                  loginData={loginData}
                  isLoading={isLoginLoading}
                  user={user}
                  onSubmit={onLogin}
                  error={error}
                  onLoginChange={(e) =>
                    updateLoginState({
                      type: "UPDATE_LOGIN_DATA",
                      payload: {
                        [e.target.name]: e.target.value,
                        isGuest: false,
                      },
                    })
                  }
                />

                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Guest Access Option or Form Type Notice */}
                <div className="mt-6">
                  <div className="text-center space-y-3">
                    <p className="text-gray-600 text-sm">
                      Don't have an account?
                    </p>
                    <Button
                      variant="bordered"
                      color="default"
                      size="lg"
                      radius="lg"
                      className="w-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
                      onPress={() =>
                        updateLoginState({
                          type: "SET_SHOW_GUEST_FORM",
                          payload: true,
                        })
                      }
                      startContent={<FiUserCheck className="w-4 h-4" />}
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <GuestForm
                guestData={loginData}
                isLoading={isLoginLoading}
                onGuestChange={(e) =>
                  updateLoginState({
                    type: "UPDATE_LOGIN_DATA",
                    payload: { [e.target.name]: e.target.value, isGuest: true },
                  })
                }
                onSubmit={onLogin}
                error={error}
                onBackToLogin={() =>
                  updateLoginState({
                    type: "SET_SHOW_GUEST_FORM",
                    payload: false,
                  })
                }
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
