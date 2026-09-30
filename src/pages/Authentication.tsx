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
import { ChangeEvent, SyntheticEvent, useCallback, useRef, useState } from "react";
import { PasswordInput } from "../component/FormComponent/Input";
import { ForgotPasswordType, Logindatatype } from "../types/Login.types";
import PictureBreakAndCombine from "../component/Animation/LogoAnimated";
import ApiRequest from "../hooks/APIHook/ApiHook";
import SuccessToast, { ErrorToast, InfoToast } from "../component/Modal/AlertModal";
import ReactDomSever from "react-dom/server";
import EmailTemplate from "../component/FormComponent/EmailTemplate";
import { memo, useMemo } from "react";
import PrivacyPolicy from "../component/Cookie/PrivacyPolicy";
import { FiMail, FiLock, FiUser, FiShield } from "react-icons/fi";
import { getPendingRedirect, clearPendingRedirect } from "../utils/authRedirect";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/user.store";
import { UserSessionData } from "../hooks/useUserSession";
import { motion } from "framer-motion";
type authenticationtype = "login" | "prelogin" | "signup" | "forgot";

// Flying Logos Background Component
const FlyingLogos = memo(() => {
  const logoUrl =
    "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2Fgraduation.png?alt=media&token=011e65f0-b57f-4c47-a1bf-3f1b070de4e4";

  // Generate random positions and animation properties for each logo
  const logos = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
        size: 30 + Math.random() * 40,
        duration: 15 + Math.random() * 10,
        delay: Math.random() * 5,
        opacity: 0.08 + Math.random() * 0.07,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {logos.map((logo) => (
        <motion.div
          key={logo.id}
          className="absolute"
          style={{
            left: `${logo.initialX}%`,
            top: `${logo.initialY}%`,
            width: logo.size,
            height: logo.size,
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: 0,
            opacity: logo.opacity,
          }}
          animate={{
            x: [0, 50, -30, 20, 0],
            y: [0, -40, 30, -20, 0],
            rotate: [0, 15, -10, 5, 0],
          }}
          transition={{
            duration: logo.duration,
            delay: logo.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        >
          <img
            src={logoUrl}
            alt=""
            className="w-full h-full object-contain filter grayscale brightness-200"
            style={{ opacity: logo.opacity }}
          />
        </motion.div>
      ))}
    </div>
  );
});

FlyingLogos.displayName = "FlyingLogos";

interface AuthFormProps {
  type: authenticationtype;
  logindata: Logindatatype;
  forgot?: ForgotPasswordType;
  loading: boolean;
  onSubmit: (e: SubmitEvent) => void;
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
  password: string,
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
    message: isValid ? "Strong password" : failedChecks.map((c) => c.message).join(", "),
    strength,
  };
};

// Simple validation function for PasswordInput component
const validatePassword = (password: string): string | null => {
  const result = validatePasswordStrength(password);
  return result.isValid ? null : result.message;
};

// Privacy Policy Modal Component
const PrivacyPolicyModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="5xl"
    scrollBehavior="inside"
    placement="center"
    classNames={{
      base: "max-h-[90vh] mx-3 sm:mx-auto max-w-[95vw] sm:max-w-3xl lg:max-w-5xl rounded-xl sm:rounded-2xl",
      body: "max-h-[65vh] sm:max-h-[70vh] overflow-y-auto p-3 sm:p-6",
      header: "p-4 sm:p-6 pb-2",
      footer: "p-4 sm:p-6 pt-2 flex flex-col sm:flex-row gap-2",
    }}
  >
    <ModalContent>
      <ModalHeader className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FiShield className="text-primary text-xl shrink-0" />
          <span className="text-base sm:text-lg font-bold">Privacy Policy & Terms of Service</span>
        </div>
      </ModalHeader>
      <ModalBody>
        <PrivacyPolicy className="p-0" />
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          onPress={onClose}
          startContent={<FiShield />}
          className="w-full sm:w-auto font-medium"
        >
          I Understand
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
));

// Enhanced Password Strength Indicator - Memoized for performance
const PasswordStrengthIndicator = memo(({ strength }: { strength: number }) => {
  const strengthConfig = useMemo(() => {
    if (strength < 2) return { color: "danger" as const, text: "Weak", bgColor: "bg-red-500" };
    if (strength < 4)
      return {
        color: "warning" as const,
        text: "Medium",
        bgColor: "bg-yellow-500",
      };
    return {
      color: "success" as const,
      text: "Strong",
      bgColor: "bg-green-500",
    };
  }, [strength]);

  return (
    <div className="w-full mt-1.5">
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="text-white/70 font-medium text-[11px] sm:text-xs">Password Strength</span>
        <Chip
          size="sm"
          color={strengthConfig.color}
          variant="flat"
          className="font-semibold text-[10px] sm:text-xs h-5"
        >
          {strengthConfig.text}
        </Chip>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 min-w-0 rounded-full transition-all duration-300 ${
              level <= strength ? strengthConfig.bgColor : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
});

PasswordStrengthIndicator.displayName = "PasswordStrengthIndicator";

const ForgotPasswordActions = memo(
  ({ loading, onCancel }: { loading: boolean; onCancel: () => void }) => (
    <div className="w-full h-auto flex flex-col sm:flex-row gap-3 justify-center mt-2">
      <Button
        type="submit"
        isLoading={loading}
        className="text-white font-bold bg-gradient-to-r from-primary to-secondary w-full sm:flex-1 h-[44px] sm:h-[45px] rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
      >
        Next
      </Button>
      <Button
        type="button"
        onPress={onCancel}
        className="text-white font-bold bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 w-full sm:flex-1 h-[44px] sm:h-[45px] rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
      >
        Cancel
      </Button>
    </div>
  ),
);

ForgotPasswordActions.displayName = "ForgotPasswordActions";

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
    const { isOpen: isPolicyOpen, onOpen: onPolicyOpen, onClose: onPolicyClose } = useDisclosure();
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Handle password change with strength calculation
    const handlePasswordChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const strength = validatePasswordStrength(value);
        setPasswordStrength(strength.strength);
        onChange(e);
      },
      [onChange],
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
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="Enter 6-digit verification code"
            type="text"
            onChange={(e) => onForgotChange(e.target.value)}
            size="lg"
            startContent={<FiMail className="text-gray-400 text-lg shrink-0" />}
            maxLength={6}
            className="text-center transition-all"
          />
        );
      }

      if (forgot?.ty === "change") {
        return (
          <>
            <div className="space-y-2 w-full">
              <PasswordInput
                isRequired
                name="password"
                placeholder="New Password"
                label="New Password"
                autoComplete="new-password"
                value={logindata.password}
                onChange={handlePasswordChange}
                validate={validatePassword}
                size="lg"
                startContent={<FiLock className="text-gray-400 text-lg shrink-0" />}
                className="transition-all"
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
              autoComplete="new-password"
              value={logindata.confirmpassword}
              onChange={onChange}
              validate={(e) => (e !== logindata.password ? "Passwords do not match" : null)}
              size="lg"
              startContent={<FiLock className="text-gray-400 text-lg shrink-0" />}
              className="transition-all"
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
      () => (e: string) => (e !== logindata.password ? "Passwords do not match" : null),
      [logindata.password],
    );

    const formActions = useCallback(() => {
      if (type === "forgot") {
        return <ForgotPasswordActions loading={loading} onCancel={onCancel} />;
      }

      return (
        <div className="w-full h-fit flex flex-col sm:flex-row gap-3 mt-2">
          {type === "signup" ? (
            <>
              <Button
                type="button"
                onPress={onBack}
                isDisabled={loading}
                variant="bordered"
                className="font-bold w-full sm:flex-1 h-[44px] sm:h-[45px] rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-white/40 text-white hover:bg-white/10"
                startContent={<FiUser className="text-lg shrink-0" />}
              >
                Back to Login
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                className="text-white font-bold bg-gradient-to-r from-success to-lightsucess w-full sm:flex-1 h-[44px] sm:h-[45px] rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                startContent={!loading && <FiUser className="text-lg shrink-0" />}
              >
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                isLoading={loading}
                className="text-white font-bold bg-gradient-to-r from-primary to-secondary w-full sm:flex-1 h-[44px] sm:h-[45px] rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                startContent={!loading && <FiLock className="text-lg shrink-0" />}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              <Button
                type="button"
                onPress={onSignup}
                isDisabled={loading}
                variant="bordered"
                className="font-bold w-full sm:flex-1 h-[44px] sm:h-[45px] rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-white/40 text-white hover:bg-white/10"
                startContent={<FiUser className="text-lg shrink-0" />}
              >
                Create Account
              </Button>
            </>
          )}
        </div>
      );
    }, [type, onBack, loading, onSignup, onCancel]);

    return (
      <>
        <Form
          ref={formRef}
          onSubmit={onSubmit as never}
          className="w-full h-fit flex flex-col gap-y-4 sm:gap-y-5 items-end"
          validationBehavior="native"
          aria-label={`${
            type === "signup" ? "Sign up" : type === "forgot" ? "Password reset" : "Sign in"
          } form`}
        >
          {type === "signup" && (
            <div className="space-y-1 w-full">
              <Input
                isRequired
                errorMessage="Please enter your full name"
                label="Full Name"
                labelPlacement="inside"
                name="name"
                autoComplete="name"
                placeholder="Enter your full name"
                type="text"
                value={logindata.name}
                onChange={onChange}
                size="lg"
                startContent={<FiUser className="text-gray-400 text-lg shrink-0" />}
                className="transition-all"
                minLength={2}
                maxLength={100}
              />
            </div>
          )}

          <div className="space-y-1 w-full">
            <Input
              isRequired
              errorMessage="Please enter a valid email address"
              label="Email Address"
              labelPlacement="inside"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Enter your email"
              type="email"
              value={logindata.email}
              onChange={onChange}
              size="lg"
              startContent={<FiMail className="text-gray-400 text-lg shrink-0" />}
              className="transition-all"
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
                  autoComplete={type === "signup" ? "new-password" : "current-password"}
                  value={logindata.password}
                  onChange={type === "signup" ? handlePasswordChange : onChange}
                  validate={type === "signup" ? validatePassword : undefined}
                  size="lg"
                  startContent={<FiLock className="text-gray-400 text-lg shrink-0" />}
                  className="transition-all"
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
                  className="text-white hover:text-gray-200 underline self-start -mt-1 p-1 h-auto text-xs sm:text-sm font-medium"
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
                    autoComplete="new-password"
                    value={logindata.confirmpassword}
                    onChange={onChange}
                    validate={passwordValidation}
                    size="lg"
                    startContent={<FiLock className="text-gray-400 text-lg shrink-0" />}
                    className="transition-all"
                  />
                </div>
              )}

              {type === "signup" && (
                <div className="w-full space-y-3 mt-1 sm:mt-2">
                  <Divider className="bg-white/30" />
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                    <Checkbox
                      name="agree"
                      onValueChange={onAgreeChange}
                      isRequired
                      color="secondary"
                      size="sm"
                      classNames={{
                        base: "items-start gap-2 sm:gap-3 m-0 p-0 max-w-full",
                        wrapper: "mt-0.5 shrink-0",
                      }}
                    >
                      <div className="text-xs sm:text-sm text-white leading-relaxed">
                        I agree to the{" "}
                        <Button
                          onPress={onPolicyOpen}
                          variant="light"
                          size="sm"
                          className="text-secondary hover:text-secondary-400 underline p-0 h-auto min-w-0 inline font-semibold text-xs sm:text-sm"
                        >
                          Terms of Service and Privacy Policy
                        </Button>{" "}
                        and consent to the processing of my personal data.
                      </div>
                    </Checkbox>
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-white underline text-[11px] sm:text-xs mt-2 inline-block transition-colors"
                    >
                      View full privacy policy →
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
          {formActions()}
        </Form>

        <PrivacyPolicyModal isOpen={isPolicyOpen} onClose={onPolicyClose} />
      </>
    );
  },
);

AuthForm.displayName = "AuthForm";

const DefaultLoginState = {
  email: "",
  password: "",
  userName: "",
  agree: false,
};

export default function AuthenticationPage() {
  const dispatch = useDispatch();
  const [page, setpage] = useState<authenticationtype>("login");
  const [forgot, setforgot] = useState<ForgotPasswordType>();
  const [loading, setloading] = useState(false);
  //const recaptcha = useRecaptchaButton();
  const [logindata, setlogindata] = useState<Logindatatype>(DefaultLoginState);

  // Function to remove reCAPTCHA script
  const handleClick = useCallback(
    (type: authenticationtype) => {
      if (page !== "signup") {
        setpage(type);
      }
    },
    [page],
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setlogindata((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleForgotChange = useCallback((code: string) => {
    setforgot((prev) => ({ ...prev, code }) as never);
  }, []);

  const handleAgreeChange = useCallback((val: boolean) => {
    setlogindata((prev) => ({ ...prev, agree: val }));
  }, []);

  const handleSubmit = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault();

      if (page === "prelogin") {
        setpage("login");
        return;
      }

      if (
        (page === "forgot" && !logindata.email) ||
        (page === "signup" && (!logindata.agree || !logindata.name?.trim()))
      ) {
        if (page === "signup" && !logindata.name?.trim()) {
          ErrorToast({
            toastid: page,
            title: "Name Required",
            content: "Please enter your full name",
          });
        }
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
            return {
              ...baseConfig,
              data: {
                email: logindata.email,
                password: logindata.password,
                name: logindata.name,
                agree: logindata.agree,
              },
              url: "/registeruser",
            };
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

      //Are you a robort
      //  const verifyreccap = await recaptcha.handleVerify();
      //  if (!verifyreccap) {
      //    setloading(false);
      //    ErrorToast({
      //      toastid: page,
      //      title: "Verification",
      //      content: "Failed To Verify",
      //    });
      //    return;
      //  }

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
      if (page === "login" && AuthenticationRequest.data) {
        SuccessToast({
          title: "Welcome!",
          content: "Successfully logged in",
        });

        //Set usersession as active
        dispatch(
          setUser({
            isAuthenticated: true,
            user: AuthenticationRequest.data as UserSessionData,
          }),
        );

        // Remove reCAPTCHA script after successful login
        //recaptcha.removeRecaptchaScript();

        // Check for pending redirect
        const pendingRedirect = getPendingRedirect();
        if (pendingRedirect && pendingRedirect.length > 0) {
          clearPendingRedirect();
          window.location.href = pendingRedirect;
          return;
        }

        window.location.reload();
      } else if (page === "signup") {
        SuccessToast({
          title: "Account Created!",
          content: "Welcome to Graduate Tracer",
        });

        // Remove reCAPTCHA script after successful signup

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
    [dispatch, forgot?.code, forgot?.ty, logindata, page],
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
    <div className="w-full min-h-screen bg-gradient-to-br from-success via-primary to-secondary dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 py-6 sm:py-10">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-5xl xl:max-w-6xl h-auto min-h-0 lg:min-h-[640px] flex flex-col lg:flex-row items-stretch justify-center shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10">
        {/* Banner */}
        <div className="banner order-2 lg:order-1 w-full lg:w-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md flex flex-col items-center justify-center gap-y-6 sm:gap-y-8 p-6 sm:p-8 lg:p-12 relative overflow-hidden">
          {/* Background banner */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-secondary/10 rounded-full translate-y-10 sm:translate-y-12 -translate-x-10 sm:-translate-x-12 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-y-5 sm:gap-y-8 max-w-md mx-auto">
            <div className="transform scale-[0.8] sm:scale-90 lg:scale-100 hover:scale-105 transition-transform duration-300 origin-center -my-2 sm:my-0">
              <PictureBreakAndCombine />
            </div>

            <div className="text-center space-y-2 sm:space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Graduate Tracer
              </h3>
              <p className="text-xs sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-md px-2 sm:px-0">
                A comprehensive form creation platform designed to streamline data collection and
                analysis for educational institutions.
              </p>
            </div>

            <div className="text-center space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <FiShield className="text-primary text-base shrink-0" />
                <span className="font-medium">Secure & Private</span>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Form */}
        <div className="authentication_page order-1 lg:order-2 w-full lg:w-1/2 bg-gradient-to-br from-primary via-primary-600 to-secondary flex flex-col items-center justify-center gap-y-6 sm:gap-y-8 p-6 sm:p-8 lg:p-12 relative overflow-hidden">
          {/* Flying Logos Background */}
          <FlyingLogos />

          {/* Background decoration */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          <div className="absolute top-0 left-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/5 rounded-full -translate-y-16 sm:-translate-y-20 -translate-x-16 sm:-translate-x-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/5 rounded-full translate-y-12 sm:translate-y-16 translate-x-12 sm:translate-x-16 pointer-events-none" />

          <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-sm xl:max-w-md space-y-6 sm:space-y-8">
            <div className="text-center space-y-2 sm:space-y-3">
              {/* Mobile-only brand badge */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-1">
                <span className="font-bold text-sm sm:text-base text-white/90 tracking-wide">
                  Graduate Tracer
                </span>
                <span className="text-[10px] sm:text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                  PIU
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl text-white font-bold tracking-tight">
                {getPageTitle()}
              </h3>
              {page === "login" && (
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  Enter your credentials to access your account
                </p>
              )}
              {page === "signup" && (
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  Join our platform and start creating amazing forms
                </p>
              )}
              {page === "forgot" && (
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  {forgot?.ty === "confirm"
                    ? "Enter the verification code sent to your email"
                    : forgot?.ty === "change"
                      ? "Create a strong new password for your account"
                      : "We'll send a verification code to your email"}
                </p>
              )}
            </div>

            <AuthForm
              type={page}
              logindata={logindata}
              forgot={forgot}
              loading={loading}
              onSubmit={handleSubmit as never}
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
      <div className="mt-6 sm:mt-8 text-center space-y-2 px-4">
        <p className="text-white/80 text-xs sm:text-sm">
          {`© ${new Date().getFullYear()} Graduate Tracer. All rights reserved.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-white/70">
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
