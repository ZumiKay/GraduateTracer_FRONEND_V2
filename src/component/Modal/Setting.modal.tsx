import { FormEvent, ReactNode, useState } from "react";
import ModalWrapper from "./Modal";
import { Button, Form, Input, Switch, Tab, Tabs } from "@heroui/react";
import { MoonIcon, SunIcon, ThemeIcon } from "../svg/GeneralIcon";
import { FiSettings, FiLogOut, FiUserX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import globalindex from "../../redux/globalindex";
import { RootState } from "../../redux/store";
import { PasswordInput } from "../FormComponent/Input";
import CookieSettingsButton from "../Cookie/CookieSettingsButton";
import ApiRequest from "../../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../Modal/AlertModal";
import { AsyncLoggout } from "../../redux/user.store";
import { useNavigate } from "react-router";
import OpenModal from "../../redux/openmodal";

interface SettingModalProps {
  open: boolean;
  onClose: () => void;
}
type TabeOptionType = "general" | "email" | "password";
const TabOption = [
  {
    name: "General",
    key: "general",
  },
  {
    name: "Email Address",
    key: "email",
  },

  {
    name: "Password",
    key: "password",
  },
];

const GeneralOption = () => {
  const dispatch = useDispatch();
  const selectstate = useSelector((state: RootState) => state.globalindex);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await AsyncLoggout();
      localStorage.removeItem("accessToken");
      navigate("/authentication");
      SuccessToast({
        title: "Success",
        content: "Logged out successfully",
      });
    } catch {
      ErrorToast({
        title: "Error",
        content: "Failed to logout",
        toastid: "logout-error",
      });
    }
  };

  const handleDeleteAccount = () => {
    dispatch(
      OpenModal.actions.setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: {
            question:
              "Are you sure you want to delete your account? This action cannot be undone.",
            onAgree: async () => {
              try {
                const response = await ApiRequest({
                  url: "/deleteuser",
                  method: "DELETE",
                  cookie: true,
                  refreshtoken: true,
                });

                if (response.success) {
                  localStorage.removeItem("accessToken");
                  navigate("/authentication");
                  SuccessToast({
                    title: "Success",
                    content: "Account deleted successfully",
                  });
                } else {
                  ErrorToast({
                    title: "Error",
                    content: "Failed to delete account",
                    toastid: "delete-error",
                  });
                }
              } catch {
                ErrorToast({
                  title: "Error",
                  content: "Failed to delete account",
                  toastid: "delete-error",
                });
              }
            },
            btn: {
              agree: "Delete Account",
              disagree: "Cancel",
            },
          },
        },
      })
    );
  };

  const ListItem = ({
    Icon,
    name,
    action,
  }: {
    Icon: ReactNode;
    name: string;
    action?: ReactNode;
  }) => {
    return (
      <div className="w-full h-fit p-2 border-b-1 border-b-gray-300">
        <div className="w-full h-fit flex flex-row items-center justify-between">
          <div className="w-full h-fit flex flex-row items-center gap-x-3">
            {Icon}
            <span className="w-fit text-sm font-normal">{name}</span>
          </div>
          {action}
        </div>
      </div>
    );
  };
  return (
    <div className="general-contianer w-full h-full flex flex-col gap-y-5">
      <ListItem
        Icon={<ThemeIcon dark={selectstate.darkmode} />}
        name="Theme"
        action={
          <Switch
            defaultSelected
            size="sm"
            className="w-full dark:text-white"
            isSelected={selectstate.darkmode}
            onValueChange={(val) => {
              dispatch(globalindex.actions.setdarkmode(val));
              if (selectstate.darkmode) {
                document.documentElement.classList.remove("dark");
              } else {
                document.documentElement.classList.add("dark");
              }
            }}
            thumbIcon={({ isSelected, className }) =>
              isSelected ? (
                <SunIcon className={className} />
              ) : (
                <MoonIcon className={className} />
              )
            }
          >
            Dark mode
          </Switch>
        }
      />
      <ListItem
        Icon={<FiSettings className="text-blue-500" />}
        name="Cookie Preferences"
        action={
          <CookieSettingsButton
            variant="bordered"
            className="font-bold max-w-sm text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Cookie Settings
          </CookieSettingsButton>
        }
      />
      <ListItem
        Icon={<FiLogOut className="text-orange-500" />}
        name="Logout from all devices"
        action={
          <Button
            color="warning"
            className="font-bold max-w-md text-orange-600 border-orange-600"
            variant="bordered"
            onPress={handleLogout}
          >
            Logout
          </Button>
        }
      />
      <ListItem
        Icon={<FiUserX className="text-red-500" />}
        name="Delete Account"
        action={
          <Button
            color="danger"
            className="text-white font-bold max-w-md"
            variant="solid"
            onPress={handleDeleteAccount}
          >
            Delete
          </Button>
        }
      />
    </div>
  );
};

const ChangeEmailAddress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"input" | "verify">("input");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const userSession = useSelector((state: RootState) => state.usersession);

  if (!userSession.user) {
    return (
      <div className="email_container flex items-center justify-center h-32">
        <p className="text-default-500">Loading user information...</p>
      </div>
    );
  }

  const handleChangeEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;

      if (step === "input") {
        // Step 1: Request verification code
        const response = await ApiRequest({
          url: "/edituser",
          method: "PUT",
          data: {
            _id: userSession.user?._id,
            email: email,
            edittype: "email",
            type: "vfy",
          },
          cookie: true,
          refreshtoken: true,
        });

        if (response.success) {
          setNewEmail(email);
          setStep("verify");
          SuccessToast({
            title: "Success",
            content: "Verification code sent to your new email",
          });
        } else {
          ErrorToast({
            title: "Error",
            content: "Failed to send verification code",
            toastid: "email-error",
          });
        }
      } else {
        // Step 2: Verify code and update email
        const verifyResponse = await ApiRequest({
          url: "/edituser",
          method: "PUT",
          data: {
            _id: userSession.user?._id,
            email: newEmail,
            edittype: "email",
            type: "confirm",
            code: code,
          },
          cookie: true,
          refreshtoken: true,
        });

        if (verifyResponse.success) {
          const editResponse = await ApiRequest({
            url: "/edituser",
            method: "PUT",
            data: {
              _id: userSession.user?._id,
              email: newEmail,
              edittype: "email",
              type: "edit",
            },
            cookie: true,
            refreshtoken: true,
          });

          if (editResponse.success) {
            SuccessToast({
              title: "Success",
              content: "Email address updated successfully",
            });
            setStep("input");
            setNewEmail("");
            setCode("");
          } else {
            ErrorToast({
              title: "Error",
              content: "Failed to update email address",
              toastid: "email-error",
            });
          }
        } else {
          ErrorToast({
            title: "Error",
            content: "Invalid verification code",
            toastid: "email-error",
          });
        }
      }
    } catch {
      ErrorToast({
        title: "Error",
        content: "Failed to update email address",
        toastid: "email-error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="email_container">
      <Form
        onSubmit={handleChangeEmail}
        validationBehavior="native"
        className="email_container w-full h-full flex flex-col gap-y-5"
      >
        <Input
          type="email"
          placeholder="Current Email Address"
          name="current_email"
          value="Your current email will be replaced"
          readOnly
          className="bg-gray-50"
        />

        {step === "input" ? (
          <>
            <Input
              type="email"
              placeholder="New Email Address"
              name="email"
              errorMessage="Please enter a valid email"
              isRequired
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <p className="text-sm text-default-500">
              Please enter your new email address. A verification code will be
              sent to confirm the change.
            </p>
            <Button
              type="submit"
              className="max-w-md font-bold"
              color="primary"
              isLoading={isLoading}
            >
              Send Verification Code
            </Button>
          </>
        ) : (
          <>
            <Input
              type="text"
              placeholder="Verification Code"
              name="code"
              errorMessage="Please enter the verification code"
              isRequired
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="text-sm text-default-500">
              Enter the verification code sent to {newEmail}
            </p>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 font-bold"
                color="primary"
                isLoading={isLoading}
              >
                Verify and Change
              </Button>
              <Button
                type="button"
                variant="bordered"
                onPress={() => {
                  setStep("input");
                  setNewEmail("");
                  setCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
};

const ChangePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const userSession = useSelector((state: RootState) => state.usersession);

  if (!userSession.user) {
    return (
      <div className="password_container flex items-center justify-center h-32">
        <p className="text-default-500">Loading user information...</p>
      </div>
    );
  }

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const currentPassword = formData.get("password") as string;
      const newPassword = formData.get("new_password") as string;

      const response = await ApiRequest({
        url: "/edituser",
        method: "PUT",
        data: {
          _id: userSession.user?._id,
          password: currentPassword,
          newpassword: newPassword,
          edittype: "password",
        },
        cookie: true,
        refreshtoken: true,
      });

      if (response.success) {
        SuccessToast({
          title: "Success",
          content: "Password changed successfully",
        });
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        ErrorToast({
          title: "Error",
          content:
            "Failed to change password. Please check your current password.",
          toastid: "password-error",
        });
      }
    } catch {
      ErrorToast({
        title: "Error",
        content: "Failed to change password",
        toastid: "password-error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Form
      onSubmit={handleChangePassword}
      validationBehavior="native"
      className="password_container w-full h-full flex flex-col gap-y-5"
    >
      <PasswordInput
        name="password"
        placeholder="Current Password"
        isRequired
        errorMessage="Please enter your current password"
      />
      <PasswordInput
        name="new_password"
        placeholder="New Password"
        isRequired
        errorMessage="Please enter a new password"
      />
      <p className="text-sm text-default-500">
        Your new password must be at least 8 characters long and contain
        uppercase, lowercase, numbers, and special characters.
      </p>
      <Button
        type="submit"
        className="max-w-md font-bold"
        color="primary"
        isLoading={isLoading}
      >
        Change Password
      </Button>
    </Form>
  );
};

export default function SettingModal({ open, onClose }: SettingModalProps) {
  const [selected, setSelected] = useState<TabeOptionType>("general");
  const selector = useSelector((state: RootState) => state.globalindex);

  return (
    <ModalWrapper
      size="xl"
      isOpen={open}
      title="Setting"
      onClose={onClose}
      className={selector.darkmode ? "bg-[#4b4747] text-white" : ""}
    >
      <div className="w-full h-full flex flex-col items-center justify-center gap-y-5">
        <Tabs
          variant={selector.darkmode ? "light" : "bordered"}
          selectedKey={selected}
          onSelectionChange={(val) => setSelected(val as never)}
          className="w-full"
        >
          {TabOption.map((tab) => (
            <Tab className="w-full" key={tab.key} title={tab.name}>
              {tab.key === "general" && <GeneralOption />}
              {tab.key === "email" && <ChangeEmailAddress />}
              {tab.key === "password" && <ChangePassword />}
            </Tab>
          ))}
        </Tabs>
      </div>
    </ModalWrapper>
  );
}
