import {
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Listbox,
  ListboxItem,
  ListboxSection,
  Button,
  Chip,
} from "@heroui/react";
import Logo from "../../assets/Logo.svg";
import ProfileIcon from "./Profile";
import { DownArrow, LogoutIcon, SettingIcon } from "../svg/GeneralIcon";
import { BellIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../../redux/openmodal";
import { RootState } from "../../redux/store";
import { AsyncLoggout } from "../../redux/user.store";
import React, { useCallback, useEffect, useRef, useState, useMemo, SyntheticEvent } from "react";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const openModalState = useSelector((root: RootState) => root.openmodal);

  const { manualSave, autoSaveStatus, isOnline, offlineQueueSize } = useImprovedAutoSave({
    debounceMs: 500,
    retryAttempts: 3,
    retryDelayMs: 2000,
  });

  const currentTab = useMemo(() => searchParam.get("tab") || "question", [searchParam]);
  const isSettingTab = useMemo(() => currentTab === "setting", [currentTab]);
  const isDashboard = useMemo(() => location.pathname === "/dashboard", [location.pathname]);
  const isAutosaveDisabled = useMemo(
    () => !formData.formstate.setting?.autosave,
    [formData.formstate.setting?.autosave],
  );
  const canSaveTabs = useMemo(
    () => ["question", "solution", "response"].includes(currentTab),
    [currentTab],
  );
  const shouldShowSaveButton = useMemo(
    () => canSaveTabs && !formData.fetchloading && isAutosaveDisabled && !isDashboard,
    [canSaveTabs, formData.fetchloading, isAutosaveDisabled, currentTab, isDashboard],
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
  }, [autoSaveStatus.status, isOnline, formHasChange, formData.formstate._id, saveloading]);

  const autoSaveStatusText = useMemo(() => {
    if (!isOnline) return "Offline";
    if (offlineQueueSize > 0) return `${offlineQueueSize} pending`;
    switch (autoSaveStatus.status) {
      case "saving":
        return autoSaveStatus.retryCount > 0
          ? `Retrying (${autoSaveStatus.retryCount})`
          : "Saving...";
      case "saved": {
        if (!autoSaveStatus.lastSaved) return "Saved";
        try {
          const d = new Date(autoSaveStatus.lastSaved);
          return isNaN(d.getTime()) ? "Saved" : `Saved ${d.toLocaleTimeString()}`;
        } catch {
          return "Saved";
        }
      }
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

  // Close profile popover and notifications dropdown when setting modal (or any modal) is open
  useEffect(() => {
    const isAnyModalOpen =
      openModalState.setting ||
      openModalState.createform ||
      openModalState.expirationalert ||
      openModalState.confirm?.open;

    if (isAnyModalOpen !== undefined && isAnyModalOpen === true) {
      setIsProfileOpen(false);
      setIsNotificationOpen(false);
    }
  }, [openModalState]);

  const handleOpenNotifications = useCallback(() => {
    setIsProfileOpen(false);
    setIsNotificationOpen(true);
  }, []);

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
    if (changedScoreValue !== null) lastDetectedScoreRef.current = changedScoreValue;
    setformHasChange(isChange || scoreChanged);
  }, [allquestion, prevAllQuestion]);

  const handleSignout = useCallback(async () => {
    setIsProfileOpen(false);
    setloading(true);
    const issignout = await AsyncLoggout();
    setloading(false);
    if (!issignout) return;
    window.location.reload();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLDivElement).blur();
    }
    e.stopPropagation();
  }, []);

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
  }, [dispatch, formData.formstate, formData.allquestion, formData.page, manualSave]);

  const applyTitleChange = useCallback(
    (newTitle: string) => {
      if (!newTitle || newTitle === formData.formstate.title) return;
      dispatch(setformstate({ ...formData.formstate, title: newTitle }));
      setformHasChange(true);
    },
    [dispatch, formData.formstate],
  );

  const handleTitleBlur = useCallback(() => {
    const newTitle = (formtitleRef.current?.textContent?.trim() || "").slice(0, 50);
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
    const newTitle = (mobileFormtitleRef.current?.textContent?.trim() || "").slice(0, 50);
    applyTitleChange(newTitle);
  }, [applyTitleChange]);

  const handleMobileTitleInput = useCallback((e: SyntheticEvent<HTMLDivElement>) => {
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
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (formData.formstate._id && shouldShowSaveButton && !saveButtonState.disabled) {
          handleManuallySave();
        }
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [formData.formstate._id, shouldShowSaveButton, saveButtonState.disabled, handleManuallySave]);

  const handleSavePress = useCallback(() => {
    if (formData.formstate._id) handleManuallySave();
  }, [formData, handleManuallySave]);

  const handleSettingsPress = useCallback(() => {
    setIsProfileOpen(false);
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
      <nav className="navigationbar sticky top-0 z-50 w-full h-14 sm:h-[70px] bg-[#f5f5f5] flex justify-center items-center px-3 dark:bg-gray-800 mb-4 sm:mb-8 shadow-sm">
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
    <nav className="navigationbar sticky top-0 z-50 w-full bg-[#f5f5f5] dark:bg-gray-800 mb-4 sm:mb-8 shadow-sm">
      <div className="flex flex-row justify-between items-center px-3 sm:px-4 min-h-14 sm:min-h-[70px]">
        {/* Left: Logo & Form Title */}
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
            className="hidden sm:block web-name text-2xl font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 max-w-[28vw] lg:max-w-[33vw] whitespace-nowrap overflow-hidden focus:whitespace-normal focus:overflow-visible"
          >
            {displayTitle.slice(0, 50)}
          </div>
        </div>

        {/* Middle: Save button on mobile/tablet */}
        <div className="flex lg:hidden items-center justify-center px-1 sm:px-2 flex-shrink-0">
          {shouldShowSaveButton ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                className="text-white font-bold shadow-sm px-3.5 sm:px-5 h-8 sm:h-9 text-xs sm:text-sm"
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
                  className={`text-[10px] sm:text-xs font-medium truncate max-w-[85px] sm:max-w-[130px] ${autoSaveStatusColor}`}
                >
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          ) : !isSettingTab && !formData.fetchloading && !isAutosaveDisabled ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <AutoSaveContainer />
              {autoSaveStatusText && (
                <span
                  className={`text-[10px] sm:text-xs font-medium truncate max-w-[85px] sm:max-w-[130px] ${autoSaveStatusColor}`}
                >
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Right: save (desktop) · autosave (desktop) · notifications · profile */}
        <div className="flex flex-row items-center justify-end gap-x-1.5 sm:gap-x-3 flex-1 lg:flex-initial flex-shrink-0">
          {shouldShowSaveButton && (
            <div className="hidden lg:flex flex-col items-end gap-0.5">
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
                <span className={`hidden sm:block text-xs ${autoSaveStatusColor}`}>
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          )}

          {!isSettingTab && !formData.fetchloading && !isAutosaveDisabled && (
            <div className="hidden lg:flex flex-col items-end gap-0.5">
              <AutoSaveContainer />
              {autoSaveStatusText && (
                <span className={`hidden sm:block text-xs ${autoSaveStatusColor}`}>
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          )}

          <NotificationContainer
            userId={userSession?.user?._id || ""}
            className="mr-0 sm:mr-1"
            isOpen={isNotificationOpen}
            onOpenChange={setIsNotificationOpen}
            onUnreadCountChange={setUnreadNotificationCount}
            hideTriggerOnMobileTablet
          />

          <Popover
            isOpen={isProfileOpen}
            onOpenChange={setIsProfileOpen}
            offset={10}
            placement="bottom-end"
            shouldFlip={false}
            disableAnimation
          >
            <PopoverTrigger>
              <Button
                variant="light"
                disableRipple
                className="h-auto p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-0 bg-transparent flex flex-row items-center gap-1 sm:gap-1.5 cursor-pointer data-[hover=true]:bg-gray-200 dark:data-[hover=true]:bg-gray-700/70"
                aria-label="User account menu"
              >
                <div className="relative flex items-center">
                  <ProfileIconContainer label={userSession.user?.name ?? "User"} color="lime" />
                  {unreadNotificationCount > 0 && (
                    <span
                      className="lg:hidden absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm ring-2 ring-white dark:ring-gray-800 animate-pulse pointer-events-none"
                      aria-label={`${unreadNotificationCount} unread notifications`}
                    >
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  )}
                </div>
                <span className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  <DownArrow className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] z-50 p-2 font-normal text-sm shadow-xl rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white dark:bg-gray-800">
              <div className="profilecontent w-full flex flex-col gap-y-2 p-1 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 px-2 py-2 border-b border-gray-100 dark:border-gray-700/80">
                  <ProfileIconContainer
                    label={userSession.user?.name ?? "User"}
                    color="lime"
                    size="w-9 h-9"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {userSession.user?.name || "User"}
                    </p>
                    {userSession.user?.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userSession.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <Listbox
                  aria-label="Account menu"
                  variant="flat"
                  className="w-full p-0"
                  onAction={() => setIsProfileOpen(false)}
                >
                  <ListboxSection showDivider className="mb-1">
                    <ListboxItem
                      key="notifications"
                      onPress={handleOpenNotifications}
                      startContent={<BellIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
                      endContent={
                        unreadNotificationCount > 0 ? (
                          <Chip size="sm" color="danger" variant="solid" className="h-5 min-w-5 px-1 text-[11px] font-bold">
                            {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                          </Chip>
                        ) : null
                      }
                      className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 lg:hidden"
                    >
                      Notifications
                    </ListboxItem>
                    <ListboxItem
                      key="setting"
                      onPress={handleSettingsPress}
                      startContent={<SettingIcon />}
                      className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60"
                    >
                      Setting
                    </ListboxItem>
                  </ListboxSection>
                  <ListboxSection>
                    <ListboxItem
                      key="signout"
                      onPress={handleSignout}
                      color="danger"
                      className="text-danger rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20"
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

      {/*  Mobile title strip  */}
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
