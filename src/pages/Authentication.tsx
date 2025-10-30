import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  Chip,
} from "@heroui/react";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PasswordInput } from "../component/FormComponent/Input";
import { ForgotPasswordType, Logindatatype } from "../types/Login.types";
import PictureBreakAndCombine from "../component/Animation/LogoAnimated";
import ApiRequest from "../hooks/ApiHook";
import { useNavigate } from "react-router";
import SuccessToast, {
  ErrorToast,
  InfoToast,
} from "../component/Modal/AlertModal";
import RecaptchaButton from "../component/FormComponent/recapcha";
import ReactDomSever from "react-dom/server";
import EmailTemplate from "../component/FormComponent/EmailTemplate";
import { useDispatch } from "react-redux";
import { AsyncGetUser } from "../redux/user.store";
import { memo, useMemo } from "react";
import PrivacyPolicy from "../component/Cookie/PrivacyPolicy";
import { FiMail, FiLock, FiUser, FiShield } from "react-icons/fi";

type authenticationtype = "login" | "prelogin" | "signup" | "forgot";

interface AuthFormProps {
  type: authenticationtype;
  logindata: Logindatatype;
  forgot?: ForgotPasswordType;
  loading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onForgotChange: (code: string) => void;
  onAgreeChange: (val: boolean) => void;
  onCancel: () => void;
  onForgotPassword: () => void;
  onBack: () => void;
  onSignup: () => void;
}

// Enhanced Password validation with strength indicator
const validatePasswordStrength = (
  password: string
): { isValid: boolean; message: string; strength: number } => {
  let strength = 0;
  const checks = [
    { test: /.{8,}/, message: "At least 8 characters" },
    { test: /[A-Z]/, message: "One uppercase letter" },
    { test: /[a-z]/, message: "One lowercase letter" },
    { test: /\d/, message: "One number" },
    { test: /[!@#$%^&*(),.?":{}|<>]/, message: "One special character" },
  ];

  for (const check of checks) {
    if (check.test.test(password)) {
      strength++;
    }
  }

  const failedChecks = checks.filter((check) => !check.test.test(password));
  const isValid = failedChecks.length === 0;

  return {
    isValid,
    message: isValid
      ? "Strong password"
      : failedChecks.map((c) => c.message).join(", "),
    strength,
  };
};

// Simple validation function for PasswordInput component
const validatePassword = (password: string): string | null => {
  const result = validatePasswordStrength(password);
  return result.isValid ? null : result.message;
};

// Privacy Policy Modal Component
const PrivacyPolicyModal = memo(
  ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "max-h-[70vh] overflow-y-auto",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FiShield className="text-primary" />
            <span>Privacy Policy & Terms of Service</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <PrivacyPolicy className="p-0" />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose} startContent={<FiShield />}>
            I Understand
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
);

// Enhanced Password Strength Indicator
const PasswordStrengthIndicator = memo(({ strength }: { strength: number }) => {
  const getStrengthColor = () => {
    if (strength < 2) return "danger";
    if (strength < 4) return "warning";
    return "success";
  };

  const getStrengthText = () => {
    if (strength < 2) return "Weak";
    if (strength < 4) return "Medium";
    return "Strong";
  };

  return (
    <div className="w-full mt-1">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-gray-400">Password Strength</span>
        <Chip size="sm" color={getStrengthColor()} variant="flat">
          {getStrengthText()}
        </Chip>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              level <= strength
                ? strength < 2
                  ? "bg-red-500"
                  : strength < 4
                  ? "bg-yellow-500"
                  : "bg-green-500"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
});

const ForgotPasswordActions = memo(
  ({ loading, onCancel }: { loading: boolean; onCancel: () => void }) => (
    <div className="w-full h-[40px] flex flex-row gap-x-5 justify-center">
      <Button
        type="submit"
        isLoading={loading}
        className="text-white font-bold bg-secondary w-full h-[40px] rounded-md"
      >
        Next
      </Button>
      <Button
        type="button"
        onPress={onCancel}
        className="text-white font-bold bg-danger w-full h-[40px] rounded-md"
      >
        Cancel
      </Button>
    </div>
  )
);

const AuthForm = memo(
  ({
    type,
    logindata,
    forgot,
    loading,
    onSubmit,
    onChange,
    onForgotChange,
    onAgreeChange,
    onCancel,
    onForgotPassword,
    onBack,
    onSignup,
  }: AuthFormProps) => {
    const formRef = useRef<HTMLFormElement | null>(null);
    const {
      isOpen: isPolicyOpen,
      onOpen: onPolicyOpen,
      onClose: onPolicyClose,
    } = useDisclosure();
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Handle password change with strength calculation
    const handlePasswordChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const strength = validatePasswordStrength(value);
        setPasswordStrength(strength.strength);
        onChange(e);
      },
      [onChange]
    );

    const forgotPasswordContent = useMemo(() => {
      if (forgot?.ty === "confirm") {
        return (
          <Input
            isRequired
            errorMessage="Please enter a valid verification code"
            label="Verification Code"
            labelPlacement="inside"
            name="code"
            placeholder="Enter 6-digit verification code"
            type="text"
            onChange={(e) => onForgotChange(e.target.value)}
            size="lg"
            startContent={<FiMail className="text-gray-400" />}
            maxLength={6}
            className="text-center"
          />
        );
      }

      if (forgot?.ty === "change") {
        return (
          <>
            <div className="space-y-2">
              <PasswordInput
                isRequired
                name="password"
                placeholder="New Password"
                label="New Password"
                value={logindata.password}
                onChange={handlePasswordChange}
                validate={validatePassword}
                size="lg"
                startContent={<FiLock className="text-gray-400" />}
              />
              {type === "signup" && logindata.password && (
                <PasswordStrengthIndicator strength={passwordStrength} />
              )}
            </div>
            <PasswordInput
              isRequired
              name="confirmpassword"
              placeholder="Confirm New Password"
              label="Confirm New Password"
              value={logindata.confirmpassword}
              onChange={onChange}
              validate={(e) =>
                e !== logindata.password ? "Passwords do not match" : null
              }
              size="lg"
              startContent={<FiLock className="text-gray-400" />}
            />
          </>
        );
      }

      return null;
    }, [
      forgot?.ty,
      logindata.password,
      logindata.confirmpassword,
      onChange,
      onForgotChange,
      handlePasswordChange,
      passwordStrength,
      type,
    ]);

    const passwordValidation = useMemo(
      () => (e: string) =>
        e !== logindata.password ? "Passwords do not match" : null,
      [logindata.password]
    );

    const formActions = useMemo(() => {
      if (type === "forgot") {
        return <ForgotPasswordActions loading={loading} onCancel={onCancel} />;
      }

      return (
        <div className="w-full h-fit flex flex-row gap-x-3">
          {type === "signup" ? (
            <Button
              type="button"
              onPress={onBack}
              isDisabled={loading}
              variant="bordered"
              className="font-bold w-full h-[45px] rounded-lg transition-all hover:scale-105"
              startContent={<FiUser className="text-lg" />}
            >
              Back to Login
            </Button>
          ) : (
            <>
              <span></span>
              <Button
                type="submit"
                isLoading={loading}
                className="text-white font-bold bg-gradient-to-r from-primary to-secondary w-full h-[45px] rounded-lg transition-all hover:scale-105 shadow-lg"
                startContent={!loading && <FiLock className="text-lg" />}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </>
          )}
          {type === "signup" ? (
            <>
              <span></span>
              <Button
                type="submit"
                isLoading={loading}
                className="text-white font-bold bg-gradient-to-r from-success to-lightsucess w-full h-[45px] rounded-lg transition-all hover:scale-105 shadow-lg"
                startContent={!loading && <FiUser className="text-lg" />}
              >
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onPress={onSignup}
              isDisabled={loading}
              variant="bordered"
              className="font-bold w-full h-[45px] rounded-lg transition-all hover:scale-105"
              startContent={<FiUser className="text-lg" />}
            >
              Create Account
            </Button>
          )}
        </div>
      );
    }, [type, onBack, loading, onSignup, onCancel]);

    return (
      <>
        <Form
          ref={formRef}
          onSubmit={onSubmit}
          className="w-[90%] h-fit flex flex-col gap-y-6 items-end"
          validationBehavior="native"
          aria-label={`${
            type === "signup"
              ? "Sign up"
              : type === "forgot"
              ? "Password reset"
              : "Sign in"
          } form`}
        >
          <div className="space-y-1 w-full">
            <Input
              isRequired
              errorMessage="Please enter a valid email address"
              label="Email Address"
              labelPlacement="inside"
              name="email"
              placeholder="Enter your email"
              type="email"
              value={logindata.email}
              onChange={onChange}
              size="lg"
              startContent={<FiMail className="text-gray-400" />}
              className="transition-all focus-within:scale-[1.02]"
            />
          </div>

          {forgotPasswordContent}

          {type !== "forgot" && (
            <>
              <div className="space-y-2 w-full">
                <PasswordInput
                  isRequired
                  name="password"
                  placeholder="Password"
                  label="Password"
                  value={logindata.password}
                  onChange={type === "signup" ? handlePasswordChange : onChange}
                  validate={type === "signup" ? validatePassword : undefined}
                  size="lg"
                  startContent={<FiLock className="text-gray-400" />}
                  className="transition-all focus-within:scale-[1.02]"
                />
                {type === "signup" && logindata.password && (
                  <PasswordStrengthIndicator strength={passwordStrength} />
                )}
              </div>

              {type === "login" || type === "prelogin" ? (
                <Button
                  onPress={onForgotPassword}
                  variant="light"
                  size="sm"
                  className="text-white hover:text-gray-200 underline self-start"
                >
                  Forgot your password?
                </Button>
              ) : (
                <div className="space-y-2 w-full">
                  <PasswordInput
                    isRequired
                    name="confirmpassword"
                    placeholder="Confirm Password"
                    label="Confirm Password"
                    value={logindata.confirmpassword}
                    onChange={onChange}
                    validate={passwordValidation}
                    size="lg"
                    startContent={<FiLock className="text-gray-400" />}
                    className="transition-all focus-within:scale-[1.02]"
                  />
                </div>
              )}

              {type === "signup" && (
                <div className="w-full space-y-3">
                  <Divider className="bg-white/20" />
                  <Checkbox
                    name="agree"
                    onValueChange={onAgreeChange}
                    isRequired
                    color="secondary"
                    size="sm"
                    classNames={{
                      base: "items-start",
                      wrapper: "mt-1",
                    }}
                  >
                    <div className="text-sm text-white leading-relaxed">
                      I agree to the{" "}
                      <Button
                        onPress={onPolicyOpen}
                        variant="light"
                        size="sm"
                        className="text-secondary hover:text-secondary-400 underline p-0 h-auto min-w-0 inline"
                      >
                        Terms of Service and Privacy Policy
                      </Button>{" "}
                      and consent to the processing of my personal data.
                      <br />
                    </div>
                  </Checkbox>
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white underline p-0 h-auto min-w-0 inline text-xs mt-1"
                  >
                    View full privacy policy →
                  </a>
                </div>
              )}

              {formActions}
            </>
          )}
        </Form>

        <PrivacyPolicyModal isOpen={isPolicyOpen} onClose={onPolicyClose} />
      </>
    );
  }
);

const DefaultLoginState = {
  email: "",
  password: "",
  agree: false,
};

export default function AuthenticationPage() {
  const [page, setpage] = useState<authenticationtype>("login");
  const [forgot, setforgot] = useState<ForgotPasswordType>();
  const [loading, setloading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const recaptcha = RecaptchaButton();
  const [logindata, setlogindata] = useState<Logindatatype>(DefaultLoginState);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${
      import.meta.env.VITE_RECAPTCHA_KEY
    }`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleClick = useCallback(
    (type: authenticationtype) => {
      if (page !== "signup") {
        setpage(type);
      }
    },
    [page]
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setlogindata((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleForgotChange = useCallback((code: string) => {
    setforgot((prev) => ({ ...prev, code } as never));
  }, []);

  const handleAgreeChange = useCallback((val: boolean) => {
    setlogindata((prev) => ({ ...prev, agree: val }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (page === "prelogin") {
        setpage("login");
        return;
      }

      if (
        (page === "forgot" && !logindata.email) ||
        (page === "signup" && !logindata.agree)
      ) {
        return;
      }

      // Validate password strength for signup and forgot password change
      if (
        (page === "signup" || (page === "forgot" && forgot?.ty === "change")) &&
        validatePassword(logindata.password)
      ) {
        ErrorToast({
          toastid: page,
          title: "Password Error",
          content: validatePassword(logindata.password) as string,
        });
        return;
      }

      const getRequestConfig = () => {
        const baseConfig = { method: "POST", data: {}, url: "", cookie: false };

        switch (page) {
          case "login":
            return {
              ...baseConfig,
              data: logindata,
              url: "/login",
              cookie: true,
            };
          case "signup":
            return { ...baseConfig, data: logindata, url: "/registeruser" };
          case "forgot": {
            const html = ReactDomSever.renderToStaticMarkup(<EmailTemplate />);
            const forgotData =
              forgot?.ty === "vfy"
                ? { ty: "vfy", email: logindata.email, html }
                : forgot?.ty === "confirm"
                ? { ty: "confirm", email: logindata.email, code: forgot.code }
                : forgot?.ty === "change"
                ? {
                    ty: "change",
                    email: logindata.email,
                    password: logindata.password,
                  }
                : {};
            return {
              ...baseConfig,
              method: "PUT",
              data: forgotData,
              url: "/forgotpassword",
            };
          }
          default:
            return baseConfig;
        }
      };

      setloading(true);

      const verifyreccap = await recaptcha.handleVerify();
      if (!verifyreccap) {
        setloading(false);
        ErrorToast({
          toastid: page,
          title: "Verification",
          content: "Failed To Verify",
        });
        return;
      }

      const config = getRequestConfig();
      const AuthenticationRequest = await ApiRequest(config as never);
      setloading(false);

      if (!AuthenticationRequest.success) {
        ErrorToast({
          toastid: page,
          title: "Error",
          content: AuthenticationRequest.error ?? "Error Occurred",
        });
        return;
      }

      // Handle success responses
      if (page === "login") {
        dispatch(AsyncGetUser() as never);
        SuccessToast({
          title: "Welcome!",
          content: "Successfully logged in",
        });
        navigate("/dashboard", { replace: true });
      } else if (page === "signup") {
        SuccessToast({
          title: "Account Created!",
          content: "Welcome to Graduate Tracer",
        });
        setlogindata(DefaultLoginState);
        setpage("login");
      } else if (page === "forgot") {
        if (forgot?.ty === "vfy") {
          InfoToast({
            title: "Email Sent",
            content: "Please check your email for verification code",
          });
          setforgot({ ty: "confirm" });
        } else if (forgot?.ty === "confirm") {
          InfoToast({
            title: "Verified",
            content: "Code verified successfully",
          });
          setforgot({ ty: "change" });
        } else if (forgot?.ty === "change") {
          setforgot(undefined);
          setlogindata((prev) => ({ ...prev, email: "" }));
          SuccessToast({
            title: "Password Updated",
            content: "Your password has been changed successfully",
          });
          setpage("login");
        }
      }
    },
    [dispatch, forgot?.code, forgot?.ty, logindata, navigate, page, recaptcha]
  );

  const handleCancel = useCallback(() => {
    setpage("login");
    setforgot(undefined);
    setlogindata(DefaultLoginState);
  }, []);

  const handleForgotPassword = useCallback(() => {
    setpage("forgot");
    setforgot({ ty: "vfy" });
  }, []);

  const handleBack = useCallback(() => {
    setpage("login");
    setlogindata(DefaultLoginState);
  }, []);

  const handleSignup = useCallback(() => {
    handleClick("signup");
    setlogindata(DefaultLoginState);
  }, [handleClick]);

  // Dynamic page title
  const getPageTitle = () => {
    switch (page) {
      case "signup":
        return "Create Account";
      case "forgot":
        if (forgot?.ty === "confirm") return "Verify Code";
        if (forgot?.ty === "change") return "New Password";
        return "Reset Password";
      default:
        return "Welcome Back";
    }
  };

  return (
    <div className="w-full min-h-screen h-full bg-gradient-to-br from-success via-primary to-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl h-auto min-h-[700px] flex flex-row items-stretch justify-center shadow-2xl rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
        {/* Left Banner */}
        <div className="banner w-full md:w-[500px] h-full bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-y-8 p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full translate-y-12 -translate-x-12" />

          <div className="relative z-10 flex flex-col items-center gap-y-8">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <PictureBreakAndCombine />
            </div>

            <div className="text-center space-y-4">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Graduate Tracer
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed max-w-md">
                A comprehensive form creation platform designed to streamline
                data collection and analysis for educational institutions.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <FiShield className="text-primary" />
                <span>Secure & Private</span>
              </div>
              <p className="text-xs text-gray-500 max-w-sm">
                Developed as a proof of concept for Paragon International
                University
              </p>
            </div>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="authentication_page w-full md:w-[500px] bg-gradient-to-br from-primary via-primary-600 to-secondary flex flex-col items-center justify-center gap-y-8 p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 -translate-x-20" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 translate-x-16" />

          <div className="relative z-10 w-full max-w-sm space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-4xl text-white font-bold">
                {getPageTitle()}
              </h3>
              {page === "login" && (
                <p className="text-white/80 text-sm">
                  Enter your credentials to access your account
                </p>
              )}
              {page === "signup" && (
                <p className="text-white/80 text-sm">
                  Join our platform and start creating amazing forms
                </p>
              )}
            </div>

            <AuthForm
              type={page}
              logindata={logindata}
              forgot={forgot}
              loading={loading}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onForgotChange={handleForgotChange}
              onAgreeChange={handleAgreeChange}
              onCancel={handleCancel}
              onForgotPassword={handleForgotPassword}
              onBack={handleBack}
              onSignup={handleSignup}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-white/70 text-sm">
          {`© ${new Date().getFullYear()} Graduate Tracer. All rights reserved.`}
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-white/60">
          <span>Secure Login</span>
          <span>•</span>
          <span>Privacy Protected</span>
          <span>•</span>
          <span>Data Encrypted</span>
        </div>
      </div>
    </div>
  );
}
