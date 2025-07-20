// Debug utility for form access issues
export const debugFormAccess = async (formId: string) => {
  console.log("=== Form Access Debug Utility ===");
  console.log("Testing form ID:", formId);

  try {
    // Test the setting endpoint specifically
    const settingResponse = await fetch(
      `/v0/api/filteredform?ty=setting&q=${formId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    console.log("Setting API Response Status:", settingResponse.status);

    if (settingResponse.ok) {
      const data = await settingResponse.json();
      console.log("Setting API Success:", data);
    } else {
      const errorData = await settingResponse.json();
      console.error("Setting API Error:", errorData);
    }

    // Also test the detail endpoint for comparison
    const detailResponse = await fetch(
      `/v0/api/filteredform?ty=detail&q=${formId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    console.log("Detail API Response Status:", detailResponse.status);

    if (detailResponse.ok) {
      const data = await detailResponse.json();
      console.log("Detail API Success - Access Info:", {
        isOwner: data.data?.isOwner,
        isCollaborator: data.data?.isCollaborator,
        hasAccess: data.data?.isOwner || data.data?.isCollaborator,
      });
    } else {
      const errorData = await detailResponse.json();
      console.error("Detail API Error:", errorData);
    }
  } catch (error) {
    console.error("Debug test failed:", error);
  }

  console.log("=== Debug Complete ===");
};

// Add to window for easy access
declare global {
  interface Window {
    debugFormAccess: typeof debugFormAccess;
  }
}

window.debugFormAccess = debugFormAccess;
console.log(
  "Form access debug utility loaded. Usage: debugFormAccess('your-form-id')"
);
