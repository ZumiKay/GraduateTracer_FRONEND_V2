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
import {
  setformstate,
  setprevallquestion,
  setallquestion,
  setpage,
  setreloaddata,
  setfetchloading,
} from "../../redux/formstore";
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

  const { manualSave, autoSaveStatus, isOnline, offlineQueueSize } =
    useImprovedAutoSave({
      debounceMs: 500,
      retryAttempts: 3,
      retryDelayMs: 2000,
    });

  // Memoized values
  const currentTab = useMemo(
    () => searchParam.get("tab") || "question",
    [searchParam]
  );
  const isSettingTab = useMemo(() => currentTab === "setting", [currentTab]);
  const isDashboard = useMemo(
    () => location.pathname === "/dashboard",
    [location.pathname]
  );
  const isAutosaveDisabled = useMemo(
    () => !formData.formstate.setting?.autosave,
    [formData.formstate.setting?.autosave]
  );

  const canSaveTabs = useMemo(
    () => ["question", "solution", "response"].includes(currentTab),
    [currentTab]
  );

  // Only show save button for tabs that have saveable content and when autosave is disabled
  const shouldShowSaveButton = useMemo(
    () =>
      canSaveTabs &&
      !formData.fetchloading &&
      isAutosaveDisabled &&
      !isDashboard,
    [canSaveTabs, formData.fetchloading, isAutosaveDisabled, isDashboard]
  );

  // Enhanced save button status based on autosave status
  const saveButtonState = useMemo(() => {
    if (autoSaveStatus.status === "saving") {
      return {
        disabled: true,
        loading: true,
        text: "Saving...",
        color: "default" as const,
      };
    }
    if (autoSaveStatus.status === "error") {
      return {
        disabled: false,
        loading: false,
        text: "Retry Save",
        color: "danger" as const,
      };
    }
    if (!isOnline) {
      return {
        disabled: true,
        loading: false,
        text: "Offline",
        color: "warning" as const,
      };
    }
    return {
      disabled: !formHasChange || !formData.formstate._id,
      loading: saveloading,
      text: "Save",
      color: "success" as const,
    };
  }, [
    autoSaveStatus.status,
    isOnline,
    formHasChange,
    formData.formstate._id,
    saveloading,
  ]);

  // Show autosave status indicator
  const autoSaveStatusText = useMemo(() => {
    if (!isOnline) return "Offline";
    if (offlineQueueSize > 0) return `${offlineQueueSize} pending`;

    switch (autoSaveStatus.status) {
      case "saving":
        return autoSaveStatus.retryCount > 0
          ? `Retrying... (${autoSaveStatus.retryCount})`
          : "Saving...";
      case "saved":
        return autoSaveStatus.lastSaved
          ? `Saved ${new Date(autoSaveStatus.lastSaved).toLocaleTimeString()}`
          : "Saved";
      case "error":
        return autoSaveStatus.error || "Save failed";
      case "offline":
        return "Offline";
      default:
        return "";
    }
  }, [autoSaveStatus, isOnline, offlineQueueSize]);

  const displayTitle = useMemo(() => {
    if (formData.formstate.title) return formData.formstate.title;
    return isDashboard ? "Graduate Tracer" : "";
  }, [formData.formstate.title, isDashboard]);

  const isPopoverOpen = useMemo(
    () =>
      Object.values(openmodal).some((i) => i === true) ? false : undefined,
    [openmodal]
  );

  const { allquestion, prevAllQuestion } = formData;
  useEffect(() => {
    const isChange = hasArrayChange(allquestion, prevAllQuestion);

    const sameLength = allquestion.length === prevAllQuestion.length;
    const scoreChanged = sameLength
      ? allquestion.some((q, i) => {
          const a = q?.score ?? null;
          const b = prevAllQuestion[i]?.score ?? null;
          return a !== b;
        })
      : true;

    const finalHasChange = isChange || scoreChanged;

    setformHasChange(finalHasChange);
  }, [allquestion, prevAllQuestion]);

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
      // Prevent event bubbling to avoid triggering navigation
      e.stopPropagation();
    },
    []
  );

  const handleManuallySave = useCallback(async () => {
    if (!formData.formstate._id) return;

    setsaveloading(true);
    try {
      const success = await manualSave();
      if (success) {
        setformHasChange(false); // Reset change state after successful save
      }
    } catch (error) {
      console.error("Manual save failed:", error);
    } finally {
      setsaveloading(false);
    }
  }, [formData.formstate._id, manualSave]);

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (
          formData.formstate._id &&
          shouldShowSaveButton &&
          !saveButtonState.disabled
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
    shouldShowSaveButton,
    saveButtonState.disabled,
    handleManuallySave,
  ]);

  const handleTitleBlur = useCallback(() => {
    if (formtitleRef.current) {
      const newTitle = formtitleRef.current.textContent?.trim() || "";
      if (newTitle !== formData.formstate.title && newTitle.length > 0) {
        // Update the form state with the new title
        dispatch(
          setformstate({
            ...formData.formstate,
            title: newTitle,
          })
        );
      }
    }
    handleManuallySave();
  }, [handleManuallySave, formData.formstate, dispatch]);

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
    // Navigate to dashboard
    navigate("/dashboard");

    // Reset state
    dispatch(setformstate(DefaultFormState));
    dispatch(setallquestion([]));
    dispatch(setprevallquestion([]));
    dispatch(setpage(1));
    dispatch(setreloaddata(false));
    dispatch(setfetchloading(false));
  }, [dispatch, navigate]);

  // Check if user is authenticated
  const isAuthenticated = userSession?.user?._id;

  // If user is not authenticated, show only logo in center
  if (!isAuthenticated) {
    return (
      <nav className="navigationbar sticky top-0 z-50 w-full h-[70px] bg-[#f5f5f5] flex flex-row justify-center items-center p-2 dark:bg-gray-800 mb-10 shadow-sm">
        <Image
          src={Logo}
          alt="logo"
          loading="eager"
          onClick={handleToHome}
          className="w-[50px] h-[50px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
        />
      </nav>
    );
  }

  return (
    <nav className="navigationbar sticky top-0 z-50 w-full h-[70px] bg-[#f5f5f5] flex flex-row justify-between items-center p-2 dark:bg-gray-800 mb-10 shadow-sm">
      <div className="w-fit h-full flex flex-row items-center gap-x-5">
        <Image
          src={Logo}
          alt="logo"
          loading="eager"
          onClick={handleToHome}
          className="w-[50px] h-[50px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
        />
        <div
          ref={formtitleRef}
          contentEditable={!!formData.formstate.title}
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="web-name text-3xl max-w-[500px] max-h-full overflow-x-auto font-bold max-[450px]:hidden dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1"
        >
          {displayTitle}
        </div>
      </div>

      <div className="profile">
        <div className="w-fit h-full flex flex-row items-center gap-x-3">
          {shouldShowSaveButton && (
            <div className="flex flex-col items-end gap-1">
              <Button
                className="text-white font-bold"
                variant="solid"
                color={saveButtonState.color}
                isDisabled={saveButtonState.disabled}
                isLoading={saveButtonState.loading}
                onPress={handleSavePress}
                aria-label="Save form changes"
                size="sm"
              >
                {saveButtonState.text}
              </Button>
              {autoSaveStatusText && (
                <span
                  className={`text-xs ${
                    autoSaveStatus.status === "error"
                      ? "text-red-500"
                      : autoSaveStatus.status === "saving"
                      ? "text-blue-500"
                      : autoSaveStatus.status === "saved"
                      ? "text-green-500"
                      : !isOnline
                      ? "text-orange-500"
                      : "text-gray-500"
                  }`}
                >
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          )}

          {!isSettingTab && !formData.fetchloading && !isAutosaveDisabled && (
            <div className="flex flex-col items-end gap-1">
              <MemoizedAutoSaveForm />
              {autoSaveStatusText && (
                <span
                  className={`text-xs ${
                    autoSaveStatus.status === "error"
                      ? "text-red-500"
                      : autoSaveStatus.status === "saving"
                      ? "text-blue-500"
                      : autoSaveStatus.status === "saved"
                      ? "text-green-500"
                      : !isOnline
                      ? "text-orange-500"
                      : "text-gray-500"
                  }`}
                >
                  {autoSaveStatusText}
                </span>
              )}
            </div>
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
