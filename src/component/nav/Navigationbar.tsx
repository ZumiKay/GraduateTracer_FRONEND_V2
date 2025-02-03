import {
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Listbox,
  ListboxItem,
  ListboxSection,
  Button,
} from "@nextui-org/react";

import Logo from "../../assets/Logo.svg";
import ProfileIcon from "./Profile";
import {
  ArchiveIcon,
  DownArrow,
  LogoutIcon,
  SettingIcon,
} from "../svg/GeneralIcon";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../../redux/openmodal";
import { RootState } from "../../redux/store";
import { AsyncLoggout, logout } from "../../redux/user.store";
import { useState } from "react";
import ApiRequest from "../../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../Modal/AlertModal";

export default function NavigationBar() {
  const dispatch = useDispatch();
  const [loading, setloading] = useState(false);
  const [isFormEdit, setisFormEdit] = useState(false);

  const formtitle = useSelector(
    (root: RootState) => root.allform.formstate?.title
  );
  const openmodal = useSelector((root: RootState) => root.openmodal.setting);
  const autosave = useSelector((root: RootState) => root.globalindex.autosave);

  const handleSignout = async () => {
    setloading(true);
    const issignout = await AsyncLoggout();
    setloading(false);
    if (!issignout) return;
    dispatch(logout());
  };
  const handleSaveContent = async () => {
    setloading(true);
    const request = await ApiRequest({
      method: "PUT",
      url: "/savecontent",
      cookie: true,
      refreshtoken: true,
    });
    setloading(false);

    if (!request.success) {
      ErrorToast({
        toastid: "Save Content",
        title: "Failed",
        content: "Can't Save",
      });
      return;
    }
    SuccessToast({ title: "Success", content: "Saved" });
  };

  return (
    <nav className="navigationbar w-full h-[70px] bg-[#f5f5f5] flex flex-row justify-between items-center p-2 dark:bg-gray-800 mb-10">
      <div className="w-fit h-full flex flex-row items-center gap-x-5">
        <Image
          src={Logo}
          alt="logo"
          loading="eager"
          className="w-[50px] h-[50px] object-contain"
        />
        <h1
          contentEditable={formtitle ? true : false}
          suppressContentEditableWarning
          onBlur={() => console.log("Edit Form Title")}
          className="web-name text-3xl font-bold max-[450px]:hidden dark:text-white"
        >
          {formtitle ? formtitle : "Graduate Tracer"}
        </h1>
      </div>
      <div className="profile">
        <div className="w-fit h-full flex flex-row items-center gap-x-3">
          {!autosave && (
            <Button
              className="max-w-xs text-white font-bold"
              variant="solid"
              color="success"
              isDisabled={!isFormEdit}
              onPress={() => handleSaveContent()}
            >
              Save
            </Button>
          )}
          <ProfileIcon label="John Doe" color="lime" />
          <Popover
            isOpen={
              Object.values(openmodal).some((i) => i === true)
                ? false
                : undefined
            }
            offset={20}
            placement="bottom"
          >
            <PopoverTrigger>
              <span className="w-fit h-full hover:rounded-md hover:bg-gray-200 flex flex-row items-center justify-center">
                <DownArrow />
              </span>
            </PopoverTrigger>
            <PopoverContent className="max-w-[280px] z-50 overflow-auto w-fit p-1 font-normal text-sm">
              <div className="profilecontent px-2 py-2 w-full flex flex-col gap-y-5">
                <p className="text-left">zumilock011@gmail.com</p>
                <Listbox
                  aria-label="Listbox menu with sections"
                  variant="solid"
                  className="w-full h-fit"
                >
                  <ListboxSection showDivider>
                    <ListboxItem startContent={<ArchiveIcon />}>
                      Achieve
                    </ListboxItem>
                  </ListboxSection>
                  <ListboxSection showDivider>
                    <ListboxItem
                      onPress={() =>
                        dispatch(
                          OpenModal.actions.setopenmodal({
                            state: "setting",
                            value: true,
                          })
                        )
                      }
                      startContent={<SettingIcon />}
                    >
                      Setting
                    </ListboxItem>
                  </ListboxSection>
                  <ListboxSection>
                    <ListboxItem
                      onPress={() => handleSignout()}
                      color="danger"
                      startContent={<LogoutIcon />}
                    >
                      {loading ? "Signing Out" : "SignOut"}
                    </ListboxItem>
                  </ListboxSection>
                </Listbox>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}
