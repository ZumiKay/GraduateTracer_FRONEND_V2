import React from "react";
import { Button, Input, Checkbox, Form } from "@heroui/react";
import { FiMail, FiLock } from "react-icons/fi";
import { PasswordInput } from "../FormComponent/Input";
import { LoginData } from "../../types/PublicFormAccess.types";
import { SessionState } from "../../redux/user.store";
import { onLoginFuncType } from "./AuthContainer";

interface LoginFormProps {
  loginData: LoginData;
  isLoading: boolean;
  user?: SessionState;
  onLoginChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: onLoginFuncType;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loginData,
  isLoading,
  user,
  onSubmit,
  onLoginChange,
}) => {
  return (
    <div className="space-y-6">
      <Form onSubmit={onSubmit} className="space-y-5 w-full">
        <div className="space-y-1 w-full">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="Email"
            fullWidth
            value={loginData.email}
            onChange={onLoginChange}
            radius="lg"
            size="lg"
            className="w-full"
            startContent={<FiMail className="w-4 h-4 text-gray-400" />}
            isRequired
          />
        </div>

        <div className="space-y-1 w-full">
          <PasswordInput
            name="password"
            fullWidth
            label="Password"
            placeholder="Enter your password"
            value={loginData.password}
            onChange={onLoginChange}
            radius="lg"
            size="lg"
            className="w-full"
            isRequired
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <Checkbox
            name="rememberMe"
            isSelected={loginData.rememberMe}
            onValueChange={(val) =>
              onLoginChange({
                target: { name: "rememberMe", value: val as never } as never,
              } as never)
            }
            size="sm"
            radius="md"
            classNames={{
              base: "data-[selected=true]:bg-blue-500",
              wrapper: "border-gray-300",
            }}
          >
            <span className="text-sm text-gray-600">Remember me</span>
          </Checkbox>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            color="primary"
            size="lg"
            radius="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            isLoading={isLoading}
            startContent={<FiLock className="w-4 h-4" />}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          {user && user?.isAuthenticated && user.user && (
            <Button
              type="button"
              onPress={() => onSubmit(undefined, { existed: "1" })}
              color="secondary"
              size="lg"
              radius="lg"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              {`Continue as ${user?.user?.email}`}
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};
