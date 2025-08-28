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
import ApiRequest from "../../hooks/ApiHook";
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
import useRespondentFormPaginaition from "./hooks/usePaginatedFormData";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

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
const useUserProfile = (enabled: boolean = true, email: string) => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const result = await ApiRequest({
        url: "user/profile?email=" + email,
        method: "GET",
        cookie: true,
      });
      return result;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled, // Only run when enabled
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
  const { formId, token } = useParams<{ formId: string; token: string }>();
  const user = useSelector((root: RootState) => root.usersession);

  const loginMutation = useLogin();

  const [loginData, setLoginData] = useState<LoginData>({
    email: user.user?.email ?? "",
    password: "",
    rememberMe: false,
  });
  const [guestData, setGuestData] = useState<GuestData>({
    name: "",
    email: "",
  });

  //Fetch Content
  const formReqData = useRespondentFormPaginaition({
    formId,
    token,
  });
  const [accessMode, setAccessMode] = useState<
    "login" | "guest" | "authenticated"
  >("login");

  const {
    data: userProfileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useUserProfile(
    !!formReqData.formState &&
      !formReqData.isLoading &&
      !guestData &&
      loginData &&
      accessMode === "authenticated",
    loginData.email
  );

  const [showGuestForm, setShowGuestForm] = useState(false);

  useEffect(() => {
    if (userProfileData?.success || user.isAuthenticated) {
      setAccessMode("authenticated");
    } else if (
      !isLoadingProfile &&
      (profileError || !userProfileData?.success)
    ) {
      const guestData = getGuestData();
      if (guestData) {
        setGuestSession(guestData);
      } else {
        setAccessMode("login");
      }
    }
  }, [userProfileData, isLoadingProfile, profileError, user.isAuthenticated]);

  const clearGuestSession = () => {
    clearGuestData();
    setAccessMode("login");
    setGuestData({ name: "", email: "" });
  };

  const setGuestSession = (data: GuestData) => {
    storeGuestData(data);
    setGuestData(data);
    setAccessMode("guest");
  };

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

  if (isLoadingProfile || formReqData.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (formReqData.error && !formReqData.formState) {
    const errorMessage =
      formReqData.error instanceof Error
        ? formReqData.error.message
        : "Failed to load form";
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="danger" title="Error">
          {errorMessage}
        </Alert>
      </div>
    );
  }

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
          data={formReqData}
          isGuest={accessMode === "guest"}
          RespondentData={
            accessMode === "guest"
              ? guestData
              : user.user
              ? {
                  email: user.user?.email as string,
                  name: user.user?.name as string,
                }
              : undefined
          }
          userId={user.user?._id}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <FiUser className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {formReqData.formState?.title || "Form Access"}
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
                  isLoading={false}
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
