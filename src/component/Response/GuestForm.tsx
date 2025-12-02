import React from "react";
import { Button, Input, Form, Checkbox } from "@heroui/react";
import { FiMail, FiUser, FiUserCheck } from "react-icons/fi";
import { GuestData } from "../../types/PublicFormAccess.types";

interface GuestFormProps {
  guestData: GuestData;
  isLoading: boolean;
  onGuestChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
  onRememberMeChange: (val: boolean) => void;
}

export const GuestForm: React.FC<GuestFormProps> = ({
  guestData,
  isLoading,
  onGuestChange,
  onSubmit,
  onBackToLogin,
  onRememberMeChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
          <FiUserCheck className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Guest Access
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Please provide your details to continue
        </p>
      </div>

      <Form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1 w-full">
          <Input
            name="name"
            type="text"
            label="Full Name"
            placeholder="Enter your full name"
            value={guestData.name}
            onChange={onGuestChange}
            variant="bordered"
            radius="lg"
            size="lg"
            className="w-full"
            classNames={{
              input: "text-gray-700 dark:text-gray-200",
              inputWrapper:
                "border-gray-200 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 focus-within:border-emerald-500 bg-white/50 dark:bg-gray-800/50 transition-colors",
              label: "text-gray-600 dark:text-gray-400 font-medium",
            }}
            startContent={
              <FiUser className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            }
            isRequired
          />
        </div>

        <div className="space-y-1 w-full">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={guestData.email}
            onChange={onGuestChange}
            variant="bordered"
            radius="lg"
            size="lg"
            className="w-full"
            classNames={{
              input: "text-gray-700 dark:text-gray-200",
              inputWrapper:
                "border-gray-200 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 focus-within:border-emerald-500 bg-white/50 dark:bg-gray-800/50 transition-colors",
              label: "text-gray-600 dark:text-gray-400 font-medium",
            }}
            startContent={
              <FiMail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            }
            isRequired
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <Checkbox
            name="rememberMe"
            isSelected={guestData.rememberMe}
            onValueChange={onRememberMeChange}
            size="sm"
            radius="md"
            classNames={{
              base: "data-[selected=true]:bg-blue-500",
              wrapper: "border-gray-300 dark:border-gray-600",
            }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </span>
          </Checkbox>
        </div>

        <div className="flex space-x-3 pt-2">
          <Button
            type="button"
            variant="bordered"
            size="lg"
            radius="lg"
            className="flex-1 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all duration-200"
            onPress={onBackToLogin}
          >
            Back to Login
          </Button>

          <Button
            type="submit"
            color="secondary"
            size="lg"
            radius="lg"
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            isLoading={isLoading}
            startContent={<FiUserCheck className="w-4 h-4" />}
          >
            Continue as Guest
          </Button>
        </div>
      </Form>
    </div>
  );
};
