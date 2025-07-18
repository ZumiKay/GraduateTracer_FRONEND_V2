// Test script to verify form access functionality
export const testFormAccess = async () => {
  console.log("=== Testing Form Access ===");

  // Get current URL to extract form ID
  const currentUrl = window.location.href;
  const formIdMatch = currentUrl.match(/\/form\/([^/?]+)/);

  if (!formIdMatch) {
    console.error("No form ID found in URL");
    return;
  }

  const formId = formIdMatch[1];
  console.log("Testing form ID:", formId);

  // Test the API directly
  try {
    const response = await fetch(`/v0/api/filteredform?ty=detail&q=${formId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    console.log("API Response Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("API Response Data:", data);

      if (data.data) {
        console.log("Form Access Information:", {
          isOwner: data.data.isOwner,
          isCollaborator: data.data.isCollaborator,
          hasAccess: data.data.isOwner || data.data.isCollaborator,
        });
      }
    } else {
      console.error("API Error:", response.status, response.statusText);
      const errorData = await response.json();
      console.error("Error Data:", errorData);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }

  console.log("=== Test Complete ===");
};

// Add to window for easy access
const globalWindow = window as unknown as Window & {
  testFormAccess: typeof testFormAccess;
};
globalWindow.testFormAccess = testFormAccess;
console.log(
  "Added testFormAccess() to window. Run testFormAccess() to test form access."
);
