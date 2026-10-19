import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { RootState } from "../../redux/store";

const MAX_AVATARS = 3;
const PANEL_WIDTH = 288;
const VIEWPORT_MARGIN = 8;
// Set once the user has seen the explanation, so it only opens by itself once
const COLLAB_INTRO_SEEN_KEY = "collab_intro_seen";

const hasSeenIntro = () => {
  try {
    return localStorage.getItem(COLLAB_INTRO_SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

const markIntroSeen = () => {
  try {
    localStorage.setItem(COLLAB_INTRO_SEEN_KEY, "1");
  } catch {
    // Storage unavailable: the intro simply opens again next time
  }
};

/**
 * Shows that live collaboration is active: avatars of the other people who
 * have this form's editor open, plus an explanation of what that means.
 * The explanation opens by itself the first time someone else joins.
 * Renders nothing when you are the only one here.
 */
const CollaboratorPresence = () => {
  const users = useSelector((root: RootState) => root.collab?.users);
  const myUserId = useSelector((root: RootState) => root.usersession?.user?._id);
  const [infoOpen, setInfoOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({
    top: 0,
    left: 0,
    width: PANEL_WIDTH,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const others = useMemo(() => {
    const seen = new Set<string>();
    return (users ?? []).filter((user) => {
      if (user.userId === myUserId || seen.has(user.userId)) return false;
      seen.add(user.userId);
      return true;
    });
  }, [users, myUserId]);

  const isCollaborating = others.length > 0;

  // First time working alongside someone: explain what is going on
  useEffect(() => {
    if (isCollaborating && !hasSeenIntro()) setInfoOpen(true);
  }, [isCollaborating]);

  const closeInfo = useCallback(() => {
    markIntroSeen();
    setInfoOpen(false);
  }, []);

  const positionPanel = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const width = Math.min(PANEL_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
    const left = Math.min(
      Math.max(rect.right - width, VIEWPORT_MARGIN),
      viewportWidth - width - VIEWPORT_MARGIN,
    );
    setPanelPos({ top: rect.bottom + 8, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!infoOpen) return;
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [infoOpen, positionPanel]);

  // Close on Escape or a click elsewhere
  useEffect(() => {
    if (!infoOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeInfo();
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        closeInfo();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [infoOpen, closeInfo]);

  if (!isCollaborating) return null;

  const shown = others.slice(0, MAX_AVATARS);
  const hiddenCount = others.length - shown.length;
  const names = others.map((user) => user.name).join(", ");

  return (
    <div ref={containerRef} className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
      <div
        className="flex items-center gap-1.5 min-w-0"
        role="status"
        aria-label={`Also editing: ${names}`}
        title={`Also editing: ${names}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden sm:inline text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          Live
        </span>
        <div className="flex -space-x-1.5">
          {shown.map((user) => (
            <span
              key={user.userId}
              className="grid h-6 w-6 sm:h-7 sm:w-7 place-content-center rounded-full bg-primary dark:bg-emerald-500 text-[10px] sm:text-xs font-semibold text-white ring-2 ring-white dark:ring-gray-900 select-none"
            >
              {(user.name || "?")[0]?.toUpperCase()}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-content-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-semibold text-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-900 select-none">
              +{hiddenCount}
            </span>
          )}
        </div>
        <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
          {others.length === 1 ? `${others[0].name} is here` : `${others.length} others here`}
        </span>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => (infoOpen ? closeInfo() : setInfoOpen(true))}
        aria-label="About live collaboration"
        aria-expanded={infoOpen}
        className="grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-content-center rounded-full text-gray-500 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:text-emerald-300 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      >
        <InformationCircleIcon className="h-[18px] w-[18px]" />
      </button>

      {infoOpen &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Live collaboration"
            style={{
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
            }}
            className="fixed z-[60] rounded-xl border border-gray-200 bg-white p-4 text-left shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Live collaboration is on
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              You are editing this form together with {names}.
            </p>
            <ul className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-200 list-disc pl-4">
              <li>A question someone else is editing is locked until they finish.</li>
              <li>Changes they save appear here automatically. Your unsaved edits are kept.</li>
              <li>
                If you both add or remove questions at the same moment, you will be asked to reload
                the page.
              </li>
            </ul>
            <button
              type="button"
              onClick={closeInfo}
              className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
            >
              Got it
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CollaboratorPresence;
