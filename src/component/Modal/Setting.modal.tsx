import { FormEvent, ReactNode, useState } from "react";
import ModalWrapper from "./Modal";
import { Button, Form, Input, Switch, Tab, Tabs } from "@nextui-org/react";
import { MoonIcon, SunIcon, ThemeIcon } from "../svg/GeneralIcon";
import { useDispatch, useSelector } from "react-redux";
import globalindex from "../../redux/globalindex";
import { RootState } from "../../redux/store";
import { PasswordInput } from "../FormComponent/Input";

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
      <li className="w-full h-fit p-2 border-b-1 border-b-gray-300">
        <div className="w-full h-fit flex flex-row items-center justify-between">
          <div className="w-full h-fit flex flex-row items-center gap-x-3">
            {Icon}
            <span className="w-fit text-sm font-normal">{name}</span>
          </div>
          {action}
        </div>
      </li>
    );
  };
  return (
    <ul className="general-contianer w-full h-full flex flex-col gap-y-5">
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
        Icon={<></>}
        name="Logout from all devices"
        action={
          <Button
            color="danger"
            className={`font-bold max-w-md text-black dark:text-white`}
            variant="bordered"
          >
            Logout
          </Button>
        }
      />
      <ListItem
        Icon={<></>}
        name="Delete Account"
        action={
          <Button
            color="danger"
            className="text-white font-bold max-w-md"
            variant="solid"
          >
            Delete
          </Button>
        }
      />
    </ul>
  );
};

const ChangeEmailAddress = () => {
  const handleChangeEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
          placeholder="Email Address"
          name="email"
          value={"zumilock011@gmail.com"}
          readOnly
        />
        <Input
          type="email"
          placeholder="New Email Address"
          errorMessage={"Invalid Email"}
          isRequired
        />

        <p>Please confirm email address to change</p>
        <Button type="submit" className="max-w-md  font-bold" color="primary">
          Verify and Change
        </Button>
      </Form>
    </div>
  );
};

const ChangePassword = () => {
  const handleChangePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  return (
    <Form
      onSubmit={handleChangePassword}
      validationBehavior="native"
      className="email_container w-full h-full flex flex-col gap-y-5"
    >
      <PasswordInput
        name="new password"
        placeholder="New password"
        isRequired
      />
      <PasswordInput name="password" placeholder="Password" isRequired />
      <Button type="submit" className="max-w-md  font-bold" color="primary">
        Change
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
