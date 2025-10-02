import React from "react";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import { FiUser, FiUserCheck } from "react-icons/fi";
import { LoginForm } from "./LoginForm";
import { GuestForm } from "./GuestForm";
import { LoginData, GuestData } from "../../types/PublicFormAccess.types";

interface AuthContainerProps {
  formTitle?: string;
  showGuestForm: boolean;
  loginData: LoginData;
  guestData: GuestData;
  isLoginLoading: boolean;
  user: { user: Record<string, unknown> | null; isAuthenticated: boolean };
  onLoginChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGuestChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoginSubmit: (e: React.FormEvent) => void;
  onGuestSubmit: (e: React.FormEvent) => void;
  onLoginExisted: () => void;
  onShowGuestForm: () => void;
  onBackToLogin: () => void;
  onRememberMeChange: (checked: boolean) => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  formTitle,
  showGuestForm,
  loginData,
  guestData,
  isLoginLoading,
  user,
  onLoginChange,
  onGuestChange,
  onLoginSubmit,
  onGuestSubmit,
  onLoginExisted,
  onShowGuestForm,
  onBackToLogin,
  onRememberMeChange,
}) => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
                  onLoginChange={onLoginChange}
                  onSubmit={onLoginSubmit}
                  onLoginExisted={onLoginExisted}
                  onRememberMeChange={onRememberMeChange}
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
                      onPress={onShowGuestForm}
                      startContent={<FiUserCheck className="w-4 h-4" />}
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <GuestForm
                guestData={guestData}
                isLoading={isLoginLoading}
                onGuestChange={onGuestChange}
                onSubmit={onGuestSubmit}
                onBackToLogin={onBackToLogin}
                onRememberMeChange={onRememberMeChange}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
