import {
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Listbox,
  ListboxItem,
  ListboxSection,
  Button,
} from "@heroui/react";
import Logo from "../../assets/Logo.svg";
import ProfileIcon from "./Profile";
import {
  ArchiveIcon,
  DownArrow,
  LogoutIcon,
  SettingIcon,
  ResponsesIcon,
} from "../svg/GeneralIcon";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../../redux/openmodal";
import { RootState } from "../../redux/store";
import { AsyncLoggout, logout } from "../../redux/user.store";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { createSelector } from "@reduxjs/toolkit";
import { hasArrayChange } from "../../helperFunc";
import { useLocation, useSearchParams, useNavigate } from "react-router";
import AutoSaveForm from "../../hooks/AutoSaveHook";
import { ErrorToast } from "../Modal/AlertModal";
import { setformstate, setprevallquestion } from "../../redux/formstore";
import NotificationSystem from "../Notification/NotificationSystem";
import useImprovedAutoSave from "../../hooks/useImprovedAutoSave";
import { DefaultFormState } from "../../types/Form.types";
// Memoized components for better performance
const MemoizedProfileIcon = React.memo(ProfileIcon);
const MemoizedAutoSaveForm = React.memo(AutoSaveForm);
const MemoizedNotificationSystem = React.memo(NotificationSystem);

// Memoized selector to prevent unnecessary re-renders
const selectFormData = createSelector(
  (state: RootState) => state.allform.formstate,
  (state: RootState) => state.allform.allquestion,
  (state: RootState) => state.allform.prevAllQuestion,
  (state: RootState) => state.allform.fetchloading,
  (state: RootState) => state.allform.page,
  (formstate, allquestion, prevAllQuestion, fetchloading, page) => ({
    formstate,
    allquestion,
    prevAllQuestion,
    fetchloading,
    page,
  })
);

export default function Navigationbar() {
  // Memoized selectors to prevent unnecessary re-renders
  const formData = useSelector(selectFormData);
  const userSession = useSelector((root: RootState) => root.usersession);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setloading] = useState(false);
  const [saveloading, setsaveloading] = useState(false);
  const [formHasChange, setformHasChange] = useState(false);
  const formtitleRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [searchParam] = useSearchParams();

  const openmodal = useSelector((root: RootState) => root.openmodal.setting);

  // Add improved autosave hook
  const { manualSave } = useImprovedAutoSave({
    debounceMs: 500,
    retryAttempts: 3,
    retryDelayMs: 2000,
  });

  // Memoized values
  const isSettingTab = useMemo(
    () => searchParam.get("tab") === "setting",
    [searchParam]
  );
  const isDashboard = useMemo(
    () => location.pathname === "/dashboard",
    [location.pathname]
  );
  const isAutosaveDisabled = useMemo(
    () => !formData.formstate.setting?.autosave,
    [formData.formstate.setting?.autosave]
  );
  const shouldShowSaveButton = useMemo(
    () => !isSettingTab && !formData.fetchloading && isAutosaveDisabled,
    [isSettingTab, formData.fetchloading, isAutosaveDisabled]
  );

  const displayTitle = useMemo(() => {
    if (formData.formstate.title) return formData.formstate.title;
    return isDashboard ? "Graduate Tracer" : "";
  }, [formData.formstate.title, isDashboard]);

  const isPopoverOpen = useMemo(
    () =>
      Object.values(openmodal).some((i) => i === true) ? false : undefined,
    [openmodal]
  );

  // Memoized effect for form change detection
  useEffect(() => {
    const isChange = hasArrayChange(
      formData.allquestion,
      formData.prevAllQuestion
    );
    setformHasChange(!isChange);
  }, [formData.allquestion, formData.prevAllQuestion]);

  // Memoized callbacks
  const handleSignout = useCallback(async () => {
    setloading(true);
    const issignout = await AsyncLoggout();
    setloading(false);
    if (!issignout) return;
    dispatch(logout());
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        formtitleRef.current?.blur();
      }
    },
    []
  );

  const handleManuallySave = useCallback(async () => {
    if (!formData.formstate._id) return;

    setsaveloading(true);
    try {
      const success = await manualSave();
      if (success) {
        // Update the previous question state for comparison
        dispatch(setprevallquestion(formData.allquestion));
        setformHasChange(false); // Reset change state after successful save
      }
    } catch (error) {
      console.error("Manual save failed:", error);
      ErrorToast({ title: "Failed", content: "Can't Save" });
    } finally {
      setsaveloading(false);
    }
  }, [manualSave, formData.allquestion, formData.formstate._id, dispatch]);

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (
          formData.formstate._id &&
          !saveloading &&
          shouldShowSaveButton &&
          formHasChange
        ) {
          handleManuallySave();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [
    formData.formstate._id,
    saveloading,
    shouldShowSaveButton,
    formHasChange,
    handleManuallySave,
  ]);

  const handleTitleBlur = useCallback(() => {
    handleManuallySave();
  }, [handleManuallySave]);

  const handleSavePress = useCallback(() => {
    if (formData.formstate._id) {
      handleManuallySave();
    }
  }, [formData, handleManuallySave]);

  const handleSettingsPress = useCallback(() => {
    dispatch(
      OpenModal.actions.setopenmodal({
        state: "setting",
        value: true,
      })
    );
  }, [dispatch]);

  const handleToHome = useCallback(() => {
    navigate("/");
    dispatch(setformstate(DefaultFormState));
  }, [dispatch, navigate]);

  return (
    <nav className="navigationbar w-full h-[70px] bg-[#f5f5f5] flex flex-row justify-between items-center p-2 dark:bg-gray-800 mb-10">
      <div
        onClick={handleToHome}
        className="w-fit h-full flex flex-row items-center gap-x-5"
      >
        <Image
          src={Logo}
          alt="logo"
          loading="eager"
          className="w-[50px] h-[50px] object-contain"
        />
        <div
          ref={formtitleRef}
          contentEditable={!!formData.formstate.title}
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
          onKeyDown={handleKeyDown}
          className="web-name text-3xl max-w-[500px] max-h-full overflow-x-auto font-bold max-[450px]:hidden dark:text-white"
        >
          {displayTitle}
        </div>
      </div>

      <div className="profile">
        <div className="w-fit h-full flex flex-row items-center gap-x-3">
          {shouldShowSaveButton && (
            <Button
              className="max-w-xs text-white font-bold"
              variant="solid"
              color="success"
              isDisabled={!formHasChange || !formData.formstate._id}
              isLoading={saveloading}
              onPress={handleSavePress}
            >
              Save
            </Button>
          )}

          {!isSettingTab && !formData.fetchloading && !isAutosaveDisabled && (
            <MemoizedAutoSaveForm />
          )}

          <MemoizedNotificationSystem
            userId={userSession?.user?._id || ""}
            className="mr-2"
          />

          <MemoizedProfileIcon label="John Doe" color="lime" />

          <Popover isOpen={isPopoverOpen} offset={20} placement="bottom">
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
                    <ListboxItem
                      onPress={() => navigate("/my-responses")}
                      startContent={<ResponsesIcon />}
                    >
                      My Responses
                    </ListboxItem>
                  </ListboxSection>
                  <ListboxSection showDivider>
                    <ListboxItem
                      onPress={handleSettingsPress}
                      startContent={<SettingIcon />}
                    >
                      Setting
                    </ListboxItem>
                  </ListboxSection>
                  <ListboxSection>
                    <ListboxItem
                      onPress={handleSignout}
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
