/**
 * 📋 Usage Examples for useFormsessionAPI Hook
 *
 * This file demonstrates how to use the formsession API hook
 * in different React components and scenarios.
 */

import React, { useState } from "react";
import {
  useFormsessionAPI,
  useRespondentLogin,
  useSessionActions,
  useSessionVerification,
  type RespondentLoginProps,
} from "../hooks/useFormsessionAPI";
import { useAutoSessionCheck } from "../hooks/useAutoSessionCheck";

// 🎯 Example 1: Basic Respondent Login Component
export const RespondentLoginComponent: React.FC = () => {
  const { login, isLoading, isSuccess, error, reset } = useRespondentLogin();
  const [formData, setFormData] = useState<RespondentLoginProps>({
    formId: "",
    email: "",
    rememberMe: false,
    password: "",
    isGuest: false,
  });

  const handleLogin = async () => {
    try {
      await login(formData);
      console.log("✅ Login successful!");
    } catch (err) {
      console.error("❌ Login failed:", err);
    }
  };

  return (
    <div>
      <h2>Respondent Login</h2>

      <input
        type="text"
        placeholder="Form ID"
        value={formData.formId}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, formId: e.target.value }))
        }
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, email: e.target.value }))
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, password: e.target.value }))
        }
      />

      <label>
        <input
          type="checkbox"
          checked={formData.rememberMe}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }))
          }
        />
        Remember Me
      </label>

      <label>
        <input
          type="checkbox"
          checked={formData.isGuest || false}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isGuest: e.target.checked }))
          }
        />
        Guest Login
      </label>

      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "⏳ Logging in..." : "🚀 Login"}
      </button>

      {error && <div style={{ color: "red" }}>❌ {error.message}</div>}
      {isSuccess && <div style={{ color: "green" }}>✅ Login successful!</div>}

      <button onClick={reset}>🔄 Reset</button>
    </div>
  );
};

// 🎯 Example 2: Full Formsession Management Dashboard
export const FormsessionDashboard: React.FC = () => {
  const {
    respondentLogin,
    userRespondentLoginSecure,
    replaceSession,
    signOut,
    sendRemovalEmail,
    isLoading,
    error,
    clearError,
    isLoginLoading,
    isSessionLoading,
    loginSuccess,
    sessionSuccess,
  } = useFormsessionAPI();

  // 🔍 Session verification with auto-refresh
  const {
    data: sessionData,
    isLoading: isVerifying,
    refetch: refreshSession,
  } = useSessionVerification({ isActive: true }, true);

  const handleGuestLogin = async () => {
    try {
      await respondentLogin.mutateAsync({
        formId: "form123",
        email: "guest@example.com",
        rememberMe: false,
        isGuest: true,
      });
    } catch (err) {
      console.error("Guest login failed:", err);
    }
  };

  const handleSecureLogin = async () => {
    try {
      await userRespondentLoginSecure.mutateAsync({
        formId: "form123",
        rememberMe: true,
        isSwitched: false,
        email: "user@example.com",
        password: "password123",
      });
    } catch (err) {
      console.error("Secure login failed:", err);
    }
  };

  const handleReplaceSession = async () => {
    const code = prompt("Enter replacement code:");
    if (code) {
      try {
        await replaceSession.mutateAsync({ code });
      } catch (err) {
        console.error("Session replacement failed:", err);
      }
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await signOut.mutateAsync();
      } catch (err) {
        console.error("Sign out failed:", err);
      }
    }
  };

  const handleSendRemovalEmail = async () => {
    try {
      await sendRemovalEmail.mutateAsync({
        respondentEmail: "user@example.com",
        removeCode: "123456",
        formId: "form123",
      });
    } catch (err) {
      console.error("Send removal email failed:", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🎛️ Formsession Management Dashboard</h1>

      {/* Loading Indicator */}
      {isLoading && <div>⏳ Processing...</div>}

      {/* Error Display */}
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          ❌ {error}
          <button onClick={clearError} style={{ marginLeft: "10px" }}>
            ✕
          </button>
        </div>
      )}

      {/* Session Status */}
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "15px",
          marginBottom: "20px",
        }}
      >
        <h3>📊 Session Status</h3>
        {isVerifying ? (
          <div>⏳ Verifying session...</div>
        ) : sessionData ? (
          <div>
            ✅ Session Active
            {sessionData.data?.isExpired && (
              <span style={{ color: "orange" }}> (Expiring Soon)</span>
            )}
          </div>
        ) : (
          <div style={{ color: "red" }}>❌ No Active Session</div>
        )}
        <button onClick={() => refreshSession()} disabled={isVerifying}>
          🔄 Refresh Status
        </button>
      </div>

      {/* Login Actions */}
      <div style={{ marginBottom: "20px" }}>
        <h3>🚪 Login Actions</h3>
        <button
          onClick={handleGuestLogin}
          disabled={isLoginLoading}
          style={{ margin: "5px" }}
        >
          👤 Guest Login
        </button>

        <button
          onClick={handleSecureLogin}
          disabled={isLoginLoading}
          style={{ margin: "5px" }}
        >
          🔐 Secure Login
        </button>

        {loginSuccess && (
          <span style={{ color: "green" }}>✅ Login successful!</span>
        )}
      </div>

      {/* Session Management */}
      <div style={{ marginBottom: "20px" }}>
        <h3>⚙️ Session Management</h3>
        <button
          onClick={handleReplaceSession}
          disabled={isSessionLoading}
          style={{ margin: "5px" }}
        >
          🔄 Replace Session
        </button>

        <button
          onClick={handleSignOut}
          disabled={isSessionLoading}
          style={{ margin: "5px", backgroundColor: "#ff4444", color: "white" }}
        >
          🚪 Sign Out
        </button>

        {sessionSuccess && (
          <span style={{ color: "green" }}>✅ Session action successful!</span>
        )}
      </div>

      {/* Email Actions */}
      <div style={{ marginBottom: "20px" }}>
        <h3>📧 Email Actions</h3>
        <button
          onClick={handleSendRemovalEmail}
          disabled={sendRemovalEmail.isPending}
          style={{ margin: "5px" }}
        >
          📤 Send Removal Email
        </button>

        {sendRemovalEmail.isSuccess && (
          <span style={{ color: "green" }}>✅ Email sent!</span>
        )}
      </div>

      {/* Loading States */}
      <div style={{ backgroundColor: "#e8f4fd", padding: "15px" }}>
        <h3>📈 Loading States</h3>
        <div>Login Loading: {isLoginLoading ? "⏳" : "✅"}</div>
        <div>Session Loading: {isSessionLoading ? "⏳" : "✅"}</div>
        <div>Email Loading: {sendRemovalEmail.isPending ? "⏳" : "✅"}</div>
      </div>
    </div>
  );
};

// 🎯 Example 3: Session Actions Component (Simplified)
export const SessionActionsComponent: React.FC = () => {
  const {
    replace,
    signOut,
    isLoading,
    isSuccess,
    error,
    resetReplace,
    resetSignOut,
  } = useSessionActions();

  return (
    <div>
      <h3>🔧 Session Actions</h3>

      <button onClick={() => replace({ code: "123456" })} disabled={isLoading}>
        🔄 Replace Session
      </button>

      <button onClick={() => signOut()} disabled={isLoading}>
        🚪 Sign Out
      </button>

      {isLoading && <div>⏳ Processing...</div>}
      {isSuccess && <div style={{ color: "green" }}>✅ Action completed!</div>}
      {error && <div style={{ color: "red" }}>❌ {error.message}</div>}

      <button onClick={resetReplace}>🔄 Reset Replace</button>
      <button onClick={resetSignOut}>🔄 Reset Sign Out</button>
    </div>
  );
};

// 🎯 Example 5: Component with Auto Session Check
export const ProtectedFormComponent: React.FC<{ formId: string }> = ({
  formId,
}) => {
  const { isSessionValid, isExpiring, refetch } = useAutoSessionCheck(formId);

  if (!isSessionValid) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>🔒 Session Required</h2>
        <p>Please log in to access this form.</p>
        <button onClick={() => refetch()}>🔄 Check Again</button>
      </div>
    );
  }

  return (
    <div>
      {isExpiring && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "10px",
            marginBottom: "20px",
          }}
        >
          ⚠️ Your session is expiring soon. Please save your work.
        </div>
      )}

      <h1>📝 Protected Form Content</h1>
      <p>This content is only visible to authenticated users.</p>
      {/* Your form content here */}
    </div>
  );
};

export default {
  RespondentLoginComponent,
  FormsessionDashboard,
  SessionActionsComponent,
  useAutoSessionCheck,
  ProtectedFormComponent,
};
