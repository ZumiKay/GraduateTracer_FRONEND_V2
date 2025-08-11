import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Checkbox,
  Form,
  Alert,
  Spinner,
} from "@heroui/react";
import { FiUser, FiMail, FiLock, FiUserCheck } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import { FormDataType } from "../../types/Form.types";
import { PasswordInput } from "../FormComponent/Input";
import { ErrorToast } from "../Modal/AlertModal";
import SuccessToast from "../Modal/AlertModal";
import RespondentForm from "./RespondentForm";
import {
  storeGuestData,
  getGuestData,
  clearGuestData,
  validateGuestEmail,
} from "../../utils/publicFormUtils";

interface PublicFormAccessProps {
  token?: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface GuestData {
  name: string;
  email: string;
}

// Custom hooks for React Query
const useUserProfile = () => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const result = await ApiRequest({
        url: "user/profile",
        method: "GET",
        cookie: true,
      });
      return result;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const useFormData = (formId: string, token?: string) => {
  return useQuery({
    queryKey: ["formData", formId, token],
    queryFn: async () => {
      const url = token
        ? `response/form/${formId}?token=${token}`
        : `response/form/${formId}`;

      const result = (await ApiRequest({
        url,
        method: "GET",
      })) as ApiRequestReturnType;

      if (!result.success || !result.data) {
        throw new Error(result.error || "Form not found or access denied");
      }
      console.log({ result });

      return result.data as FormDataType;
    },
    enabled: !!formId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

const useLogin = () => {
  return useMutation({
    mutationFn: async (loginData: { email: string; password: string }) => {
      const result = await ApiRequest({
        url: "login",
        method: "POST",
        data: loginData,
        cookie: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Invalid credentials");
      }

      return result;
    },
  });
};

const PublicFormAccess: React.FC<PublicFormAccessProps> = () => {
  const { formId, token } = useParams<{ formId: string; token?: string }>();

  // React Query hooks
  const {
    data: userProfileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useUserProfile();

  const {
    data: form,
    isLoading: isLoadingForm,
    error: formError,
  } = useFormData(formId || "", token);

  const loginMutation = useLogin();

  // Local state
  const [accessMode, setAccessMode] = useState<
    "login" | "guest" | "authenticated"
  >("login");
  const [showGuestForm, setShowGuestForm] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [guestData, setGuestData] = useState<GuestData>({
    name: "",
    email: "",
  });

  // Check authentication status based on React Query data
  useEffect(() => {
    if (userProfileData?.success) {
      setAccessMode("authenticated");
    } else if (
      !isLoadingProfile &&
      (profileError || !userProfileData?.success)
    ) {
      // User not authenticated, check for guest data
      const guestData = getGuestData();
      if (guestData) {
        setGuestSession(guestData);
      } else {
        setAccessMode("login");
      }
    }
  }, [userProfileData, isLoadingProfile, profileError]);

  // Helper function to clear guest session
  const clearGuestSession = () => {
    clearGuestData();
    setAccessMode("login");
    setGuestData({ name: "", email: "" });
  };

  // Helper function to set guest session
  const setGuestSession = (data: GuestData) => {
    storeGuestData(data);
    setGuestData(data);
    setAccessMode("guest");
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      ErrorToast({
        title: "Error",
        content: "Please enter both email and password",
      });
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: loginData.email,
        password: loginData.password,
      });

      setAccessMode("authenticated");
      SuccessToast({
        title: "Success",
        content: "Login successful!",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid credentials";
      ErrorToast({
        title: "Login Failed",
        content: errorMessage,
      });
    }
  };

  // Handle guest access
  const handleGuestAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestData.name || !guestData.email) {
      ErrorToast({
        title: "Error",
        content: "Please enter both name and email",
      });
      return;
    }

    // Email validation
    if (!validateGuestEmail(guestData.email)) {
      ErrorToast({
        title: "Error",
        content: "Please enter a valid email address",
      });
      return;
    }

    try {
      // Store guest data in session/localStorage for the form component
      setGuestSession(guestData);
      SuccessToast({
        title: "Success",
        content: "Guest access granted!",
      });
    } catch {
      ErrorToast({
        title: "Error",
        content: "Failed to process guest access",
      });
    }
  };

  // Handle input changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Loading state
  if (isLoadingProfile || isLoadingForm) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (formError && !form) {
    const errorMessage =
      formError instanceof Error ? formError.message : "Failed to load form";
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="danger" title="Error">
          {errorMessage}
        </Alert>
      </div>
    );
  }

  // If authenticated or guest access granted, show the form
  if (accessMode === "authenticated" || accessMode === "guest") {
    return (
      <div className="w-full min-h-screen">
        {/* Guest logout option */}
        {accessMode === "guest" && (
          <div className="fixed top-4 right-4 z-10">
            <Button
              variant="light"
              size="sm"
              onPress={clearGuestSession}
              className="bg-white shadow-md"
            >
              Switch User
            </Button>
          </div>
        )}

        <RespondentForm
          isGuest={accessMode === "guest"}
          guestData={accessMode === "guest" ? guestData : undefined}
        />
      </div>
    );
  }

  // Show login page with optional guest access
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <FiUser className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {form?.title || "Form Access"}
            </h1>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {!showGuestForm ? (
            // Login Form
            <Form onSubmit={handleLogin} className="space-y-4">
              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={handleLoginChange}
                startContent={<FiMail className="text-gray-400" />}
                isRequired
              />

              <PasswordInput
                name="password"
                label="Password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleLoginChange}
                isRequired
              />

              <Checkbox
                name="rememberMe"
                isSelected={loginData.rememberMe}
                onValueChange={(checked) =>
                  setLoginData((prev) => ({ ...prev, rememberMe: checked }))
                }
              >
                Remember me
              </Checkbox>

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={loginMutation.isPending}
                startContent={<FiLock />}
              >
                Login
              </Button>

              {/* Show guest access option for quiz forms */}

              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">
                  Don't have an account?
                </p>
                <Button
                  variant="ghost"
                  color="secondary"
                  className="w-full"
                  onPress={() => setShowGuestForm(true)}
                  startContent={<FiUserCheck />}
                >
                  Continue as Guest
                </Button>
              </div>
            </Form>
          ) : (
            // Guest Access Form
            <Form onSubmit={handleGuestAccess} className="space-y-4">
              <div className="text-center mb-4 w-full">
                <h3 className="text-lg font-semibold text-gray-800">
                  Guest Access
                </h3>
                <p className="text-gray-600 text-sm">
                  Please provide your details to continue
                </p>
              </div>

              <Input
                name="name"
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                value={guestData.name}
                onChange={handleGuestChange}
                startContent={<FiUser className="text-gray-400" />}
                isRequired
              />

              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={guestData.email}
                onChange={handleGuestChange}
                startContent={<FiMail className="text-gray-400" />}
                isRequired
              />

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="light"
                  className="flex-1"
                  onPress={() => setShowGuestForm(false)}
                >
                  Back to Login
                </Button>

                <Button
                  type="submit"
                  color="secondary"
                  className="flex-1"
                  isLoading={false} // Guest access doesn't require async operation
                  startContent={<FiUserCheck />}
                >
                  Continue as Guest
                </Button>
              </div>
            </Form>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default PublicFormAccess;
