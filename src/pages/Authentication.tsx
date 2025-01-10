import { Button, Form, Input } from "@nextui-org/react";
import { ChangeEvent, FormEvent, useState } from "react";
import { PasswordInput } from "../component/FormComponent/Input";
import { ForgotPasswordType, Logindatatype } from "../types/Login.types";
import PictureBreakAndCombine from "../component/Animation/LogoAnimated";
import ApiRequest from "../hooks/ApiHook";
import ContainerLoading from "../component/Loading/ContainerLoading";
import { useNavigate } from "react-router";

type authenticationtype = "login" | "signup" | "forgot";
export default function AuthenticationPage() {
  const [page, setpage] = useState<authenticationtype>("login");
  const [forgot, setforgot] = useState<ForgotPasswordType>();
  const [loading, setloading] = useState(false);
  const [message, setmessage] = useState("");
  const navigate = useNavigate();
  const [logindata, setlogindata] = useState<Logindatatype>({
    email: "",
    password: "",
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
          data = forgot?.confirm
            ? { ty: "change", email: forgot.email }
            : forgot?.vfy
            ? { ty: "confirm", code: forgot.code, email: logindata.email }
            : { ty: "vfy", email: logindata.email };
        }
        break;
      default:
        break;
    }

    setloading(true);
    const AuthenticationRequest = await ApiRequest({
      method: page === "forgot" ? "PUT" : "POST",
      data,
      url,
    });
    setloading(false);

    if (!AuthenticationRequest.success) {
      console.log("Error Login", AuthenticationRequest.error);
    }

    if (page === "login") {
      setmessage("Loggingn In");
      navigate("/dashboard", { replace: true });
      //navigate to dashboard
    } else if (page === "signup") {
      setmessage("Account Created Successfully");
      window.location.reload();
    } else {
      if (forgot?.confirm) {
        setmessage("Password Changed Successfully");
      }
      setforgot(
        (prev) =>
          ({ ...prev, vfy: prev?.confirm, confirm: !prev?.confirm } as never)
      );
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
    <div className="w-full min-h-screen h-full bg-lightsucess flex flex-col items-center justify-center">
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
          {loading && <ContainerLoading />}

          <h3 className="text-4xl text-white font-bold pt-10">Login</h3>
          <Form
            onSubmit={handleSubmit}
            className="w-[90%] h-fit flex flex-col gap-y-5 items-end"
            validationBehavior="native"
          >
            {message && <p className="text-success-200 font-bold">{message}</p>}
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

            {forgot?.confirm && (
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

                {page === "login" ? (
                  <p
                    onClick={() => setpage("forgot")}
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

                <div className="w-full h-fit flex flex-row gap-x-5">
                  <Button
                    type={page === "login" ? "submit" : "button"}
                    onPress={() => page === "signup" && handleClick("login")}
                    className="text-white font-bold bg-secondary w-full h-[40px] rounded-md"
                  >
                    Login
                  </Button>
                  <Button
                    type={page === "signup" ? "submit" : "button"}
                    onPress={() => page === "login" && handleClick("signup")}
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
