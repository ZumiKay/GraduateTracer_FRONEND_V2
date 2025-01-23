import { Button, Checkbox, Form, Input } from "@nextui-org/react";
import { ChangeEvent, FormEvent, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { AsyncGetUser } from "../redux/user.store";

type authenticationtype = "login" | "prelogin" | "signup" | "forgot";

export default function AuthenticationPage() {
  const [page, setpage] = useState<authenticationtype>("login");
  const [forgot, setforgot] = useState<ForgotPasswordType>();
  const [loading, setloading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const recaptcha = RecaptchaButton();
  const { isAuthenticated } = useSelector(
    (root: RootState) => root.usersession
  );

  const [logindata, setlogindata] = useState<Logindatatype>({
    email: "",
    password: "",
    agree: false,
  });

  const handleClick = (type: authenticationtype) => {
    setpage(type);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setlogindata((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let url = "";
    let data = {};

    if (page === "prelogin") {
      setpage("login");
      return;
    }

    if (page === "forgot" && !logindata.email) {
      return;
    }

    if (page === "signup" && !logindata.agree) {
      return;
    }

    switch (page) {
      case "login":
        {
          url = "/login";
          data = logindata;
        }
        break;
      case "signup":
        {
          url = "/registeruser";
          data = logindata;
        }
        break;
      case "forgot":
        {
          //Forgot Password

          url = "/forgotpassword";
          const html = ReactDomSever.renderToStaticMarkup(<EmailTemplate />);
          data =
            forgot?.ty === "vfy"
              ? {
                  ty: "vfy",
                  email: logindata.email,
                  html,
                }
              : forgot?.ty === "confirm"
              ? {
                  ty: "confirm",
                  email: logindata.email,
                  code: forgot.code,
                }
              : forgot?.ty === "change"
              ? {
                  ty: "change",
                  email: logindata.email,
                  password: logindata.password,
                }
              : {};
        }
        break;
      default:
        break;
    }

    setloading(true);

    //verify recaptcha
    const verifyreccap = await recaptcha.handleVerify();

    if (!verifyreccap) {
      setloading(false);
      ErrorToast({ title: "Verification", content: "Failed To Verify" });
      return;
    }

    const AuthenticationRequest = await ApiRequest({
      method: page === "forgot" ? "PUT" : "POST",
      data,
      url,
      cookie: page === "login",
    });
    setloading(false);

    if (!AuthenticationRequest.success) {
      console.log("Error Ocucred");
      ErrorToast({
        title: "Error",
        content: AuthenticationRequest.error ?? "Error Occured",
      });
      return;
    }

    if (page === "login") {
      dispatch(AsyncGetUser() as never);
      navigate("/dashboard", { replace: true });
      //navigate to dashboard
    } else if (page === "signup") {
      SuccessToast({ title: "User", content: "Created" });
      setlogindata({ email: "", password: "" });
      e.currentTarget.reset();
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
  };

  const handleCancel = () => {
    setpage("login");
    setforgot(undefined);
  };

  const ForgotPassword = () => {
    return (
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
          onPress={() => handleCancel()}
          className="text-white font-bold bg-danger w-full h-[40px] rounded-md"
        >
          Cancel
        </Button>
      </div>
    );
  };

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
          <Form
            onSubmit={handleSubmit}
            className="w-[90%] h-fit flex flex-col gap-y-5 items-end"
            validationBehavior="native"
          >
            <p>{JSON.stringify(isAuthenticated)}</p>
            <Input
              isRequired
              errorMessage="Please enter a valid email"
              label="Email"
              labelPlacement="inside"
              name="email"
              placeholder="Enter your email"
              type="email"
              value={logindata.email}
              onChange={handleChange}
              size="lg"
            />

            {forgot?.ty === "confirm" && (
              <Input
                isRequired
                errorMessage="Please enter a valid email"
                label="Code"
                labelPlacement="inside"
                name="code"
                placeholder="Verfiy Code"
                type="number"
                onChange={(e) =>
                  setforgot(
                    (prev) => ({ ...prev, code: e.target.value } as never)
                  )
                }
                size="lg"
              />
            )}

            {forgot?.ty === "change" && (
              <>
                <PasswordInput
                  isRequired
                  name="password"
                  placeholder="Password"
                  label="New Password"
                  value={logindata.password}
                  onChange={handleChange}
                  size="lg"
                />
                <PasswordInput
                  isRequired
                  name="confirmpassword"
                  placeholder="Confirm Password"
                  label="Confirm Password"
                  value={logindata.confirmpassword}
                  onChange={handleChange}
                  validate={(e) =>
                    e !== logindata.password ? "Must match password" : null
                  }
                />
              </>
            )}

            {page === "forgot" && <ForgotPassword />}

            {page !== "forgot" && (
              <>
                <PasswordInput
                  isRequired
                  name="password"
                  placeholder="Password"
                  label="Password"
                  value={logindata.password}
                  onChange={handleChange}
                  size="lg"
                />

                {page === "login" || page === "prelogin" ? (
                  <p
                    onClick={() => {
                      setpage("forgot");
                      setforgot({ ty: "vfy" });
                    }}
                    className="text-sm text-white font-bold cursor-default hover:text-gray-300 active:text-gray-300"
                  >
                    Forgot Password
                  </p>
                ) : (
                  <>
                    <PasswordInput
                      isRequired
                      name="confirmpassword"
                      placeholder="Confirm Password"
                      label="Confirm Password"
                      value={logindata.confirmpassword}
                      onChange={handleChange}
                      validate={(e) =>
                        e !== logindata.password ? "Must match password" : null
                      }
                    />
                  </>
                )}

                {page === "signup" && (
                  <>
                    <Checkbox
                      name="agree"
                      onValueChange={(val) =>
                        setlogindata((prev) => ({ ...prev, agree: val }))
                      }
                      isRequired
                      color="secondary"
                    >
                      <p className="text-sm text-white font-bold">
                        Agree to Policy and Privacy
                      </p>
                    </Checkbox>
                  </>
                )}
                <div className="w-full h-fit flex flex-row gap-x-5">
                  {page === "signup" ? (
                    <Button
                      type={"button"}
                      onPress={() => handleClick("prelogin")}
                      isLoading={loading}
                      className="text-white font-bold bg-secondary w-full h-[40px] rounded-md"
                    >
                      Back
                    </Button>
                  ) : (
                    <Button
                      type={"submit"}
                      isLoading={loading}
                      className="text-white font-bold bg-secondary w-full h-[40px] rounded-md"
                    >
                      Login
                    </Button>
                  )}
                  <Button
                    type={page === "signup" ? "submit" : "button"}
                    onPress={() => page === "login" && handleClick("signup")}
                    isLoading={loading}
                    className="text-black font-bold bg-lightsucess w-full h-[40px] rounded-md"
                  >
                    Signup
                  </Button>
                </div>
              </>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
}
