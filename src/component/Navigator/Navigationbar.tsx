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
import { DownArrow, LogoutIcon, SettingIcon } from "../svg/GeneralIcon";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../../redux/openmodal";
import { RootState } from "../../redux/store";
import { AsyncLoggout } from "../../redux/user.store";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  SyntheticEvent,
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
  setRevalidateContent,
} from "../../redux/formstore";
import NotificationSystem from "../Notification/NotificationSystem";
import useImprovedAutoSave from "../../hooks/useImprovedAutoSave";
import { DefaultFormState } from "../../types/Form.types";
import { AutoSaveQuestion } from "../../pages/FormPage.action";

const ProfileIconContainer = React.memo(ProfileIcon);
const AutoSaveContainer = React.memo(AutoSaveForm);
const NotificationContainer = React.memo(NotificationSystem);

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
  }),
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
  const mobileFormtitleRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [searchParam] = useSearchParams();
  const openmodal = useSelector((root: RootState) => root.openmodal.setting);

  const { manualSave, autoSaveStatus, isOnline, offlineQueueSize } =
    useImprovedAutoSave({
      debounceMs: 500,
      retryAttempts: 3,
      retryDelayMs: 2000,
    });

  const currentTab = useMemo(
    () => searchParam.get("tab") || "question",
    [searchParam],
  );
  const isSettingTab = useMemo(() => currentTab === "setting", [currentTab]);
  const isDashboard = useMemo(
    () => location.pathname === "/dashboard",
    [location.pathname],
  );
  const isAutosaveDisabled = useMemo(
    () => !formData.formstate.setting?.autosave,
    [formData.formstate.setting?.autosave],
  );
  const canSaveTabs = useMemo(
    () => ["question", "solution", "response"].includes(currentTab),
    [currentTab],
  );
  const shouldShowSaveButton = useMemo(
    () =>
      canSaveTabs &&
      !formData.fetchloading &&
      isAutosaveDisabled &&
      !isDashboard,
    [
      canSaveTabs,
      formData.fetchloading,
      isAutosaveDisabled,
      currentTab,
      isDashboard,
    ],
  );

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
        text: "Retry",
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

  const autoSaveStatusText = useMemo(() => {
    if (!isOnline) return "Offline";
    if (offlineQueueSize > 0) return `${offlineQueueSize} pending`;
    switch (autoSaveStatus.status) {
      case "saving":
        return autoSaveStatus.retryCount > 0
          ? `Retrying (${autoSaveStatus.retryCount})`
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

  const autoSaveStatusColor = useMemo(() => {
    if (autoSaveStatus.status === "error") return "text-red-500";
    if (autoSaveStatus.status === "saving") return "text-blue-500";
    if (autoSaveStatus.status === "saved") return "text-green-500";
    if (!isOnline) return "text-orange-500";
    return "text-gray-500";
  }, [autoSaveStatus.status, isOnline]);

  const displayTitle = useMemo(() => {
    if (formData.formstate.title) return formData.formstate.title;
    return isDashboard ? "Graduate Tracer" : "";
  }, [formData.formstate.title, isDashboard]);

  const isPopoverOpen = useMemo(
    () =>
      Object.values(openmodal).some((i) => i === true) ? false : undefined,
    [openmodal],
  );

  const { allquestion, prevAllQuestion } = formData;
  const lastDetectedScoreRef = useRef<number | null>(null);

  useEffect(() => {
    const isChange = hasArrayChange(allquestion, prevAllQuestion);
    const sameLength = allquestion.length === prevAllQuestion.length;
    let changedScoreValue: number | null = null;
    const scoreChanged = sameLength
      ? allquestion.some((q, i) => {
          const a = q?.score ?? null;
          const b = prevAllQuestion[i]?.score ?? null;
          if (a !== b) changedScoreValue = q.score ?? null;
          return a !== b;
        })
      : allquestion.length !== prevAllQuestion.length;
    if (changedScoreValue !== null)
      lastDetectedScoreRef.current = changedScoreValue;
    setformHasChange(isChange || scoreChanged);
  }, [allquestion, prevAllQuestion]);

  const handleSignout = useCallback(async () => {
    setloading(true);
    const issignout = await AsyncLoggout();
    setloading(false);
    if (!issignout) return;
    window.location.reload();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLDivElement).blur();
      }
      e.stopPropagation();
    },
    [],
  );

  const handleManuallySave = useCallback(async () => {
    if (!formData.formstate._id) return;
    setsaveloading(true);
    try {
      const success = await manualSave({});
      if (formData.formstate.title) {
        await AutoSaveQuestion({
          data: formData.allquestion,
          formId: formData.formstate._id,
          page: formData.page,
          type: "save",
          title: formData.formstate.title,
        });
      }
      if (success) {
        setformHasChange(false);
        dispatch(setRevalidateContent(true));
      }
    } catch (error) {
      console.error("Manual save failed:", error);
    } finally {
      setsaveloading(false);
    }
  }, [
    dispatch,
    formData.formstate,
    formData.allquestion,
    formData.page,
    manualSave,
  ]);

  const applyTitleChange = useCallback(
    (newTitle: string) => {
      if (!newTitle || newTitle === formData.formstate.title) return;
      dispatch(setformstate({ ...formData.formstate, title: newTitle }));
      setformHasChange(true);
    },
    [dispatch, formData.formstate],
  );

  const handleTitleBlur = useCallback(() => {
    const newTitle = (formtitleRef.current?.textContent?.trim() || "").slice(
      0,
      50,
    );
    applyTitleChange(newTitle);
  }, [applyTitleChange]);

  const handleTitleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const text = el.textContent || "";
    if (text.length > 50) {
      el.textContent = text.slice(0, 50);
      const sel = window.getSelection();
      const range = document.createRange();
      if (el.firstChild) {
        range.setStart(el.firstChild, 50);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, []);

  const handleMobileTitleBlur = useCallback(() => {
    const newTitle = (
      mobileFormtitleRef.current?.textContent?.trim() || ""
    ).slice(0, 50);
    applyTitleChange(newTitle);
  }, [applyTitleChange]);

  const handleMobileTitleInput = useCallback(
    (e: SyntheticEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const text = el.textContent || "";
      if (text.length > 50) {
        el.textContent = text.slice(0, 50);
        // Restore cursor to end after truncation
        const sel = window.getSelection();
        const range = document.createRange();
        if (el.firstChild) {
          range.setStart(el.firstChild, 50);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
    },
    [],
  );

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
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    formData.formstate._id,
    shouldShowSaveButton,
    saveButtonState.disabled,
    handleManuallySave,
  ]);

  const handleSavePress = useCallback(() => {
    if (formData.formstate._id) handleManuallySave();
  }, [formData, handleManuallySave]);

  const handleSettingsPress = useCallback(() => {
    dispatch(OpenModal.actions.setopenmodal({ state: "setting", value: true }));
  }, [dispatch]);

  const handleToHome = useCallback(() => {
    navigate("/dashboard");
    dispatch(setformstate(DefaultFormState));
    dispatch(setallquestion([]));
    dispatch(setprevallquestion([]));
    dispatch(setpage(1));
    dispatch(setreloaddata(false));
    dispatch(setfetchloading(false));
  }, [dispatch, navigate]);

  const isAuthenticated = userSession?.user?._id;

  if (!isAuthenticated) {
    return (
      <nav className="navigationbar sticky top-0 z-50 w-full h-14 sm:h-[70px] bg-[#f5f5f5] flex justify-center items-center px-3 dark:bg-gray-800 mb-10 shadow-sm">
        <Image
          src={Logo}
          alt="logo"
          loading="eager"
          onClick={handleToHome}
          className="w-9 h-9 sm:w-[50px] sm:h-[50px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
        />
      </nav>
    );
  }

  return (
    <nav className="navigationbar sticky top-0 z-50 w-full bg-[#f5f5f5] dark:bg-gray-800 mb-10 shadow-sm">
      <div className="flex flex-row justify-between items-center px-3 sm:px-4 min-h-14 sm:min-h-[70px]">
        <div className="flex flex-row items-center gap-x-2 sm:gap-x-4 min-w-0 flex-1">
          <Image
            src={Logo}
            alt="logo"
            loading="eager"
            onClick={handleToHome}
            className="w-8 h-8 sm:w-[50px] sm:h-[50px] object-contain cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          />

          <div
            ref={formtitleRef}
            contentEditable={!!formData.formstate.title}
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
            onKeyDown={handleKeyDown}
            onInput={handleTitleInput}
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:block web-name text-2xl font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 max-w-[33vw] whitespace-nowrap overflow-hidden focus:whitespace-normal focus:overflow-visible"
          >
            {displayTitle.slice(0, 50)}
          </div>
        </div>

        {/* Right: save · autosave · notifications · profile · menu */}
        <div className="flex flex-row items-center gap-x-1.5 sm:gap-x-3 flex-shrink-0">
          {shouldShowSaveButton && (
            <div className="flex flex-col items-end gap-0.5">
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
                  className={`hidden sm:block text-xs ${autoSaveStatusColor}`}
                >
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          )}

          {!isSettingTab && !formData.fetchloading && !isAutosaveDisabled && (
            <div className="flex flex-col items-end gap-0.5">
              <AutoSaveContainer />
              {autoSaveStatusText && (
                <span
                  className={`hidden sm:block text-xs ${autoSaveStatusColor}`}
                >
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          )}

          <NotificationContainer
            userId={userSession?.user?._id || ""}
            className="mr-0 sm:mr-2"
          />

          <ProfileIconContainer
            label={userSession.user?.name ?? "User"}
            color="lime"
          />

          <Popover isOpen={isPopoverOpen} offset={20} placement="bottom-end">
            <PopoverTrigger>
              <span className="w-fit h-full hover:rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex flex-row items-center justify-center px-0.5 sm:px-1">
                <DownArrow />
              </span>
            </PopoverTrigger>
            <PopoverContent className="max-w-[280px] z-50 overflow-auto w-fit p-1 font-normal text-sm">
              <div className="profilecontent px-2 py-2 w-full flex flex-col gap-y-5">
                <p className="text-left truncate max-w-[240px]">
                  {userSession.user?.name || userSession.user?.email}
                </p>
                <Listbox
                  aria-label="Account menu"
                  variant="solid"
                  className="w-full h-fit"
                >
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
                      {loading ? "Signing Out..." : "Sign Out"}
                    </ListboxItem>
                  </ListboxSection>
                </Listbox>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Mobile title strip (hidden on sm+) ───────────────── */}
      {formData.formstate.title && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2">
          <div
            ref={mobileFormtitleRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleMobileTitleBlur}
            onKeyDown={handleKeyDown}
            onInput={handleMobileTitleInput}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-opacity-50 rounded px-1 break-words whitespace-normal"
          >
            {formData.formstate.title.slice(0, 50)}
          </div>
        </div>
      )}
    </nav>
  );
}
