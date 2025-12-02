import ApiRequest from "../hooks/ApiHook";

// Test script to verify form owner endpoints
export const testFormOwnerEndpoints = async (formId: string) => {
  console.log("Testing Form Owner Endpoints...");

  try {
    // Test get form owners
    console.log("1. Testing Get Form Owners...");
    const ownersResponse = await ApiRequest({
      url: `/getformowners/${formId}`,
      method: "GET",
      cookie: true,
    });

    console.log("Get Form Owners Response:", ownersResponse);

    // Test add form owner (with a test email)
    console.log("2. Testing Add Form Owner...");
    const addResponse = await ApiRequest({
      url: `/addformowner`,
      method: "POST",
      data: { formId, userEmail: "test@example.com" },
      cookie: true,
    });

    console.log("Add Form Owner Response:", addResponse);

    // Test remove form owner (if add was successful)
    if (addResponse.success && addResponse.data) {
      console.log("3. Testing Remove Form Owner...");
      const removeResponse = await ApiRequest({
        url: `/removeformowner`,
        method: "DELETE",
        data: { formId, userId: "test-user-id" },
        cookie: true,
      });

      console.log("Remove Form Owner Response:", removeResponse);
    }

    // Test remove self from form
    console.log("4. Testing Remove Self From Form...");
    const removeSelfResponse = await ApiRequest({
      url: `/removeselfform`,
      method: "DELETE",
      data: { formId },
      cookie: true,
    });

    console.log("Remove Self From Form Response:", removeSelfResponse);
  } catch (error) {
    console.error("Test failed:", error);
  }
};

// Debug function to check current API configuration
export const debugApiConfig = () => {
  console.log("API Configuration Debug:");
  console.log("Base URL:", import.meta.env.VITE_API_URL);
  console.log("Access Token:", localStorage.getItem("accessToken"));
  console.log("Environment:", import.meta.env.MODE);
};
