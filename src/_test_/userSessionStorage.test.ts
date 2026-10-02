import {
  getStoredUserSession,
  setStoredUserSession,
  clearStoredUserSession,
  isStoredSessionExpired,
  hasExistingActiveSession,
  USER_SESSION_STORAGE_KEY,
} from "../utils/userSessionStorage";
import { ROLE } from "../types/User.types";
import userReducer, { setUser, logout } from "../redux/user.store";

describe("userSessionStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe("setStoredUserSession & getStoredUserSession", () => {
    test("saves and retrieves active session", () => {
      const session = {
        user: {
          _id: "user123",
          name: "Test User",
          email: "test@example.com",
          role: ROLE.USER,
        },
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      };

      setStoredUserSession(session);
      const retrieved = getStoredUserSession();
      expect(retrieved).toEqual(session);
    });

    test("removes session from storage if unauthenticated or user is null", () => {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify({ isAuthenticated: true }));

      setStoredUserSession({
        user: null,
        isAuthenticated: false,
      });

      expect(localStorage.getItem(USER_SESSION_STORAGE_KEY)).toBeNull();
      expect(getStoredUserSession()).toBeNull();
    });

    test("clearStoredUserSession empties storage", () => {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, "test-data");
      clearStoredUserSession();
      expect(localStorage.getItem(USER_SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  describe("isStoredSessionExpired", () => {
    test("returns false when no session exists", () => {
      expect(isStoredSessionExpired()).toBe(false);
    });

    test("returns false when session exists but has no user", () => {
      localStorage.setItem(
        USER_SESSION_STORAGE_KEY,
        JSON.stringify({
          user: null,
          isAuthenticated: true,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        }),
      );
      expect(isStoredSessionExpired()).toBe(false);
    });

    test("returns false when session has no expiresAt", () => {
      localStorage.setItem(
        USER_SESSION_STORAGE_KEY,
        JSON.stringify({
          user: { _id: "1", name: "A", email: "a@b.com", role: ROLE.USER },
          isAuthenticated: true,
        }),
      );
      expect(isStoredSessionExpired()).toBe(false);
    });

    test("returns false when session is still valid in the future", () => {
      localStorage.setItem(
        USER_SESSION_STORAGE_KEY,
        JSON.stringify({
          user: { _id: "1", name: "A", email: "a@b.com", role: ROLE.USER },
          isAuthenticated: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        }),
      );
      expect(isStoredSessionExpired()).toBe(false);
    });

    test("returns true ONLY when an existing session exists in frontend state and is expired", () => {
      localStorage.setItem(
        USER_SESSION_STORAGE_KEY,
        JSON.stringify({
          user: { _id: "1", name: "A", email: "a@b.com", role: ROLE.USER },
          isAuthenticated: true,
          expiresAt: new Date(Date.now() - 5000).toISOString(),
        }),
      );
      expect(isStoredSessionExpired()).toBe(true);
    });
  });

  describe("hasExistingActiveSession", () => {
    test("returns false when no session exists", () => {
      expect(hasExistingActiveSession()).toBe(false);
    });

    test("returns false when session isAuthenticated is false", () => {
      localStorage.setItem(
        USER_SESSION_STORAGE_KEY,
        JSON.stringify({
          user: { _id: "1", name: "A", email: "a@b.com", role: ROLE.USER },
          isAuthenticated: false,
        }),
      );
      expect(hasExistingActiveSession()).toBe(false);
    });

    test("returns true when authenticated session exists", () => {
      localStorage.setItem(
        USER_SESSION_STORAGE_KEY,
        JSON.stringify({
          user: { _id: "1", name: "A", email: "a@b.com", role: ROLE.USER },
          isAuthenticated: true,
        }),
      );
      expect(hasExistingActiveSession()).toBe(true);
    });
  });

  describe("userStore Redux integration", () => {
    test("setUser updates Redux state and syncs to localStorage", () => {
      const userPayload = {
        user: { _id: "u1", name: "Alice", email: "alice@test.com", role: ROLE.ADMIN },
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };

      const newState = userReducer(
        { user: null, isAuthenticated: false },
        setUser(userPayload),
      );

      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user?.email).toBe("alice@test.com");
      expect(newState.expiresAt).toBe(userPayload.expiresAt);

      const stored = getStoredUserSession();
      expect(stored?.isAuthenticated).toBe(true);
      expect(stored?.user?.name).toBe("Alice");
    });

    test("logout resets Redux state and clears localStorage", () => {
      const stateWithUser = {
        user: { _id: "u1", name: "Alice", email: "alice@test.com", role: ROLE.ADMIN },
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };

      setStoredUserSession(stateWithUser);

      const newState = userReducer(stateWithUser, logout());

      expect(newState.isAuthenticated).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.expiresAt).toBeUndefined();

      expect(getStoredUserSession()).toBeNull();
    });
  });
});
