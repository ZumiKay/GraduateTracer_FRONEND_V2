import { Button, Checkbox, Form, Input } from "@heroui/react";
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
import RecaptchaButton from "../component/FormComponent/Recapcha";
import ReactDomSever from "react-dom/server";
import EmailTemplate from "../component/FormComponent/EmailTemplate";
import { useDispatch } from "react-redux";
import { AsyncGetUser } from "../redux/user.store";
import { memo, useMemo } from "react";

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

// Password validation function
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
};

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

    const forgotPasswordContent = useMemo(() => {
      if (forgot?.ty === "confirm") {
        return (
          <Input
            isRequired
            errorMessage="Please enter a valid email"
            label="Code"
            labelPlacement="inside"
            name="code"
            placeholder="Verfiy Code"
            type="number"
            onChange={(e) => onForgotChange(e.target.value)}
            size="lg"
          />
        );
      }

      if (forgot?.ty === "change") {
        return (
          <>
            <PasswordInput
              isRequired
              name="password"
              placeholder="Password"
              label="New Password"
              value={logindata.password}
              onChange={onChange}
              validate={validatePassword}
              size="lg"
            />
            <PasswordInput
              isRequired
              name="confirmpassword"
              placeholder="Confirm Password"
              label="Confirm Password"
              value={logindata.confirmpassword}
              onChange={onChange}
              validate={(e) =>
                e !== logindata.password ? "Must match password" : null
              }
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
    ]);

    const passwordValidation = useMemo(
      () => (e: string) =>
        e !== logindata.password ? "Must match password" : null,
      [logindata.password]
    );

    const formActions = useMemo(() => {
      if (type === "forgot") {
        return <ForgotPasswordActions loading={loading} onCancel={onCancel} />;
      }

      return (
        <div className="w-full h-fit flex flex-row gap-x-5">
          {type === "signup" ? (
            <Button
              type="button"
              onPress={onBack}
              isLoading={loading}
              className="text-white font-bold bg-secondary w-full h-[40px] rounded-md"
            >
              Back
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={loading}
              className="text-white font-bold bg-secondary w-full h-[40px] rounded-md"
            >
              Login
            </Button>
          )}
          {type === "signup" ? (
            <>
              <Button
                type="submit"
                className="text-black font-bold bg-lightsucess w-full h-[40px] rounded-md"
              >
                Create
              </Button>
              <span className="hidden"></span>
            </>
          ) : (
            <Button
              type="button"
              onPress={onSignup}
              isLoading={loading}
              className="text-black font-bold bg-lightsucess w-full h-[40px] rounded-md"
            >
              Signup
            </Button>
          )}
        </div>
      );
    }, [type, onBack, loading, onSignup, onCancel]);

    return (
      <Form
        ref={formRef}
        onSubmit={onSubmit}
        className="w-[90%] h-fit flex flex-col gap-y-5 items-end"
        validationBehavior="native"
      >
        <Input
          isRequired
          errorMessage="Please enter a valid email"
          label="Email"
          labelPlacement="inside"
          name="email"
          placeholder="Enter your email"
          type="email"
          value={logindata.email}
          onChange={onChange}
          size="lg"
        />

        {forgotPasswordContent}

        {type !== "forgot" && (
          <>
            <PasswordInput
              isRequired
              name="password"
              placeholder="Password"
              label="Password"
              value={logindata.password}
              onChange={onChange}
              validate={type === "signup" ? validatePassword : undefined}
              size="lg"
            />

            {type === "login" || type === "prelogin" ? (
              <p
                onClick={onForgotPassword}
                className="text-sm text-white font-bold cursor-default hover:text-gray-300 active:text-gray-300"
              >
                Forgot Password
              </p>
            ) : (
              <PasswordInput
                isRequired
                name="confirmpassword"
                placeholder="Confirm Password"
                label="Confirm Password"
                value={logindata.confirmpassword}
                onChange={onChange}
                validate={passwordValidation}
              />
            )}

            {type === "signup" && (
              <Checkbox
                name="agree"
                onValueChange={onAgreeChange}
                isRequired
                color="secondary"
              >
                <p className="text-sm text-white font-bold">
                  Agree to Policy and Privacy
                </p>
              </Checkbox>
            )}

            {formActions}
          </>
        )}
      </Form>
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
          content: AuthenticationRequest.error ?? "Error Occured",
        });
        return;
      }

      // Handle success responses
      if (page === "login") {
        dispatch(AsyncGetUser() as never);
        navigate("/dashboard", { replace: true });
      } else if (page === "signup") {
        SuccessToast({ title: "User", content: "Created" });
        setlogindata(DefaultLoginState);
        setpage("login");
      } else if (page === "forgot") {
        if (forgot?.ty === "vfy") {
          InfoToast({ title: "Info", content: "Please Check Email" });
          setforgot({ ty: "confirm" });
        } else if (forgot?.ty === "confirm") {
          InfoToast({ title: "Verified", content: "" });
          setforgot({ ty: "change" });
        } else if (forgot?.ty === "change") {
          setforgot(undefined);
          setlogindata((prev) => ({ ...prev, email: "" }));
          SuccessToast({ title: "Successfully", content: "Password Changed" });
        }
      }
    },
    [dispatch, forgot?.code, forgot?.ty, logindata, navigate, page, recaptcha]
  );

  const handleCancel = useCallback(() => {
    setpage("login");
    setforgot(undefined);
  }, []);

  const handleForgotPassword = useCallback(() => {
    setpage("forgot");
    setforgot({ ty: "vfy" });
  }, []);

  const handleBack = useCallback(() => {
    handleClick("prelogin");
  }, [handleClick]);

  const handleSignup = useCallback(() => {
    handleClick("signup");
    setlogindata(DefaultLoginState);
  }, [handleClick]);

  return (
    <div className="w-full min-h-screen h-full bg-success flex flex-col items-center justify-center">
      <div className="w-full h-[700px] flex flex-row items-center justify-center">
        <div className="banner w-[500px] h-full border-5 border-primary bg-white rounded-l-lg flex flex-col items-center gap-y-10 shadow-medium">
          <PictureBreakAndCombine />

          <h3 className="text-3xl font-bold text-black">Graduate Tracer</h3>
          <p className="w-[90%] text-2xl">
            {`Graduate Tracer is form creation web application that develop as
          school project by Kay Koizumi.`}
          </p>
          <p className="w-[90%] text-sm font-light">
            {`This Web Application act as proof of concept of Paragon International University.`}
          </p>
        </div>
        <div className="authentication_page w-[500px] h-full bg-primary rounded-r-lg flex flex-col items-center gap-y-10 relative">
          <h3 className="text-4xl text-white font-bold pt-10">Login</h3>
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
  );
}
