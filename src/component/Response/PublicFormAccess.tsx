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

const PublicFormAccess: React.FC<PublicFormAccessProps> = () => {
  const { formId, token } = useParams<{ formId: string; token?: string }>();

  const [form, setForm] = useState<FormDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  const [submitting, setSubmitting] = useState(false);

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

  // Check if user is already authenticated or has guest data
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const result = await ApiRequest({
          url: "user/profile",
          method: "GET",
          cookie: true,
        });

        if (result.success) {
          setIsAuthenticated(true);
          setAccessMode("authenticated");
        } else {
          // Check for existing guest data
          const guestData = getGuestData();
          if (guestData) {
            setGuestSession(guestData);
          }
        }
      } catch {
        // User not authenticated, check for guest data
        const guestData = getGuestData();
        if (guestData) {
          setGuestSession(guestData);
        }
      }
    };

    checkAuthentication();
  }, [formId, token]);

  // Fetch form data to check if it's public and determine access requirements
  useEffect(() => {
    const fetchFormData = async () => {
      if (!formId) return;

      try {
        setLoading(true);
        const url = token
          ? `response/form/${formId}?token=${token}`
          : `response/form/${formId}`;

        const result = (await ApiRequest({
          url,
          method: "GET",
        })) as ApiRequestReturnType;

        if (result.success && result.data) {
          setForm(result.data as FormDataType);

          // If user is already authenticated, skip login
          if (isAuthenticated) {
            setAccessMode("authenticated");
          } else {
            // Check for existing guest data
            const guestData = getGuestData();
            if (guestData) {
              setGuestSession(guestData);
            } else {
              // For public forms, show login page first
              setAccessMode("login");
            }
          }
        } else {
          setError("Form not found or access denied");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [formId, token, isAuthenticated]);

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
      setSubmitting(true);
      const result = await ApiRequest({
        url: "login",
        method: "POST",
        data: {
          email: loginData.email,
          password: loginData.password,
        },
        cookie: true,
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAccessMode("authenticated");
        SuccessToast({
          title: "Success",
          content: "Login successful!",
        });
      } else {
        ErrorToast({
          title: "Login Failed",
          content: result.error || "Invalid credentials",
        });
      }
    } catch {
      ErrorToast({
        title: "Error",
        content: "Login failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
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
      setSubmitting(true);

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
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="danger" title="Error">
          {error}
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
                isLoading={submitting}
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
                  isLoading={submitting}
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
