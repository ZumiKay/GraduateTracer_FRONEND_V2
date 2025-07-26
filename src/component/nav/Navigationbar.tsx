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
import { AutoSaveQuestion } from "../../pages/FormPage.action";
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

  // Add improved autosave hook (we only need it for the component, not for manual save)
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

  // Only show save button for tabs that have saveable content and when autosave is disabled
  const canSaveTabs = useMemo(
    () => ["question", "solution", "response"].includes(currentTab),
    [currentTab]
  );

  const shouldShowSaveButton = useMemo(
    () =>
      canSaveTabs &&
      !formData.fetchloading &&
      isAutosaveDisabled &&
      !isDashboard,
    [canSaveTabs, formData.fetchloading, isAutosaveDisabled, isDashboard]
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
      // Prevent event bubbling to avoid triggering navigation
      e.stopPropagation();
    },
    []
  );

  const handleManuallySave = useCallback(async () => {
    if (!formData.formstate._id) return;

    setsaveloading(true);
    try {
      let response = null;

      // Prepare the data for saving, cleaning conditional properties
      const saveData = formData.allquestion.map((question) => ({
        ...question,
        conditional: question.conditional?.map((cond) => ({
          ...cond,
          contentIdx: undefined, // Remove contentIdx as it's not needed for backend
        })),
      }));

      // Handle different tab saving and get the full response
      switch (currentTab) {
        case "question":
        case "solution":
        case "response":
        default:
          response = await AutoSaveQuestion({
            data: saveData,
            page: formData.page,
            formId: formData.formstate._id,
            type: "save",
          });
          break;
      }

      if (response && response.success) {
        // Update questions with server-returned data that includes _id values
        if (response.data && Array.isArray(response.data)) {
          dispatch(setallquestion(response.data));
          dispatch(setprevallquestion(response.data));
        } else {
          // Fallback to current state if no data returned
          dispatch(setprevallquestion(formData.allquestion));
        }
        setformHasChange(false); // Reset change state after successful save
      } else {
        throw new Error(response?.message || "Save failed");
      }
    } catch (error) {
      console.error("Manual save failed:", error);
      ErrorToast({ title: "Failed", content: "Can't Save" });
    } finally {
      setsaveloading(false);
    }
  }, [
    formData.allquestion,
    formData.formstate._id,
    formData.page,
    dispatch,
    currentTab,
  ]);

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

    // Reset all form-related state
    dispatch(setformstate(DefaultFormState));
    dispatch(setallquestion([]));
    dispatch(setprevallquestion([]));
    dispatch(setpage(1));
    dispatch(setreloaddata(false));
    dispatch(setfetchloading(false));
  }, [dispatch, navigate]);

  return (
    <nav className="navigationbar w-full h-[70px] bg-[#f5f5f5] flex flex-row justify-between items-center p-2 dark:bg-gray-800 mb-10">
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
            <Button
              className="max-w-xs text-white font-bold"
              variant="solid"
              color="success"
              isDisabled={!formHasChange || !formData.formstate._id}
              isLoading={saveloading}
              onPress={handleSavePress}
              aria-label="Save form changes"
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
