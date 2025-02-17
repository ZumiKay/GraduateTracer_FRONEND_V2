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
import { useEffect, useRef, useState } from "react";
import { hasArrayChange } from "../../helperFunc";
import { useLocation } from "react-router";
import AutoSaveForm from "../../hooks/AutoSaveHook";
import { AutoSaveQuestion } from "../../pages/FormPage.action";
import { ErrorToast } from "../Modal/AlertModal";
import { ContentType } from "../../types/Form.types";

export default function NavigationBar() {
  const dispatch = useDispatch();
  const [loading, setloading] = useState(false);
  const location = useLocation();

  const {
    formstate,
    allquestion,
    prevAllQuestion,

    fetchloading,
  } = useSelector((root: RootState) => root.allform);
  const [formHasChange, setformHasChange] = useState(false);
  const openmodal = useSelector((root: RootState) => root.openmodal.setting);
  const page = useSelector((root: RootState) => root.allform.page);
  const [saveloading, setsaveloading] = useState(false);

  const formtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isChange = hasArrayChange(allquestion, prevAllQuestion);
    setformHasChange(!isChange);
  }, [allquestion]);

  const handleSignout = async () => {
    setloading(true);
    const issignout = await AsyncLoggout();
    setloading(false);
    if (!issignout) return;
    dispatch(logout());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent new line
      formtitleRef.current?.blur(); // Optionally blur to finish editing
    }
  };
  async function handleManuallySave<t>(data: t, type?: string) {
    setsaveloading(true);
    const saveReq = await AutoSaveQuestion({
      data: data as never,
      page,
      type: (type as never) ?? "save",
      formId: formstate._id ?? "",
    });
    setsaveloading(false);
    if (!saveReq.success) {
      ErrorToast({ title: "Failed", content: "Can't Save" });
      return;
    }
    setformHasChange(false);
  }

  return (
    <nav className="navigationbar w-full h-[70px] bg-[#f5f5f5] flex flex-row justify-between items-center p-2 dark:bg-gray-800 mb-10">
      <div className="w-fit h-full flex flex-row items-center gap-x-5">
        <Image
          src={Logo}
          alt="logo"
          loading="eager"
          className="w-[50px] h-[50px] object-contain"
        />
        <div
          ref={formtitleRef}
          contentEditable={formstate.title ? true : false}
          suppressContentEditableWarning
          onBlur={(val) =>
            handleManuallySave<object>(
              {
                title: val.currentTarget.innerHTML.toString(),
                _id: formstate._id,
              },
              "edit"
            )
          }
          onKeyDown={handleKeyDown}
          className="web-name text-3xl max-w-[500px] max-h-full overflow-x-auto font-bold max-[450px]:hidden dark:text-white 
          "
        >
          {formstate.title
            ? formstate.title
            : location.pathname === "/dashboard"
            ? "Graduate Tracer"
            : ""}
        </div>
      </div>
      <div className="profile">
        <div className="w-fit h-full flex flex-row items-center gap-x-3">
          {fetchloading ? (
            <></>
          ) : !formstate.setting?.autosave ? (
            <Button
              className="max-w-xs text-white font-bold"
              variant="solid"
              color="success"
              isDisabled={!formHasChange || !formstate._id}
              isLoading={saveloading}
              onPress={() =>
                formstate._id &&
                handleManuallySave<Array<ContentType>>(allquestion)
              }
            >
              Save
            </Button>
          ) : (
            <AutoSaveForm />
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
