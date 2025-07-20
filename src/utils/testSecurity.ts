// Security Test Utility for Enhanced Authentication
// This utility helps test the improved authentication and security features

export const testSecurityFeatures = async () => {
  console.log("=== Security Enhancement Testing ===");

  // Test 1: Check Session Enhancement
  console.log("\n1. Testing Enhanced CheckSession...");
  try {
    const sessionResponse = await fetch("/v0/api/checksession", {
      method: "GET",
      credentials: "include",
    });

    console.log("Session Check Status:", sessionResponse.status);

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log("Session Data:", {
        authenticated: sessionData.data?.authenticated,
        tokenValid: sessionData.data?.tokenValid,
        requiresRefresh: sessionData.data?.requiresRefresh,
        userEmail: sessionData.data?.user?.email,
        userRole: sessionData.data?.user?.role,
      });
    } else {
      const errorData = await sessionResponse.json();
      console.log("Session Error:", errorData);
    }
  } catch (error) {
    console.error("Session test failed:", error);
  }

  // Test 2: Test Token Validation
  console.log("\n2. Testing Token Validation...");
  try {
    const formResponse = await fetch("/v0/api/getallform", {
      method: "GET",
      credentials: "include",
    });

    console.log("Form Access Status:", formResponse.status);

    if (!formResponse.ok) {
      const errorData = await formResponse.json();
      console.log("Auth Error:", errorData.message);
    } else {
      console.log("✓ Token validation successful");
    }
  } catch (error) {
    console.error("Token test failed:", error);
  }

  // Test 3: Test Enhanced Security Routes
  console.log("\n3. Testing Enhanced Security Routes...");

  const secureRoutes = [
    { path: "/v0/api/getallform", method: "GET", description: "Get All Forms" },
    {
      path: "/v0/api/filteredform?ty=user",
      method: "GET",
      description: "Get User Forms",
    },
  ];

  for (const route of secureRoutes) {
    try {
      const response = await fetch(route.path, {
        method: route.method,
        credentials: "include",
      });

      console.log(
        `${route.description}: ${
          response.status === 200
            ? "✓ Success"
            : `✗ Failed (${response.status})`
        }`
      );

      if (!response.ok && response.status !== 401 && response.status !== 403) {
        const errorData = await response.json();
        console.log(`  Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error(`${route.description} test failed:`, error);
    }
  }

  // Test 4: Test Authentication State
  console.log("\n4. Testing Authentication State...");
  const accessToken = localStorage.getItem("accessToken");
  const hasRefreshCookie = document.cookie.includes("refresh_token");

  console.log("Authentication State:", {
    hasAccessToken: !!accessToken,
    hasRefreshCookie,
    tokenLength: accessToken?.length || 0,
  });

  console.log("\n=== Security Test Complete ===");

  // Return summary
  return {
    testCompleted: true,
    timestamp: new Date().toISOString(),
  };
};

// Add to window for easy access
declare global {
  interface Window {
    testSecurityFeatures: typeof testSecurityFeatures;
  }
}

window.testSecurityFeatures = testSecurityFeatures;

console.log(
  "Security testing utility loaded. Run testSecurityFeatures() to test enhanced security."
);
