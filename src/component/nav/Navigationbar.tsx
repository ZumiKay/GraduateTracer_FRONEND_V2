import {
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Listbox,
  ListboxItem,
  ListboxSection,
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

export default function NavigationBar() {
  const dispatch = useDispatch();

  const formtitle = useSelector(
    (root: RootState) => root.globalindex.formtitle
  );
  const openmodal = useSelector((root: RootState) => root.openmodal.setting);

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
          contentEditable
          suppressContentEditableWarning
          onBlur={() => console.log("Edit Form Title")}
          className="web-name text-3xl font-bold max-[450px]:hidden dark:text-white"
        >
          {formtitle ?? "Graduate Tracer"}
        </h1>
      </div>
      <div className="profile">
        <div className="w-fit h-full flex flex-row items-center gap-x-3">
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
                    <ListboxItem color="danger" startContent={<LogoutIcon />}>
                      SignOut
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
