import { formOwnerService } from "../services/formOwnerService";

// Debug function to check form access
export const debugFormAccess = async (formId: string) => {
  console.log("=== Form Access Debug ===");
  console.log("Form ID:", formId);

  try {
    // Check form access
    const accessResult = await formOwnerService.checkFormAccess(formId);
    console.log("Form Access Result:", accessResult);

    if (accessResult?.hasAccess) {
      // Get form owners
      const ownersResult = await formOwnerService.getFormOwners(formId);
      console.log("Form Owners Result:", ownersResult);

      if (ownersResult?.data) {
        console.log("Primary Owner:", ownersResult.data.primaryOwner);
        console.log("Additional Owners:", ownersResult.data.additionalOwners);
        console.log("Total Owners:", ownersResult.data.totalOwners);
      }
    } else {
      console.log("❌ User does not have access to this form");
    }
  } catch (error) {
    console.error("Debug Form Access Error:", error);
  }

  console.log("=== End Debug ===");
};

// Function to test form owner management
export const testFormOwnerManagement = async (
  formId: string,
  testEmail: string
) => {
  console.log("=== Testing Form Owner Management ===");

  try {
    // 1. Check initial access
    const initialAccess = await formOwnerService.checkFormAccess(formId);
    console.log("1. Initial access:", initialAccess);

    if (!initialAccess?.hasAccess) {
      console.log("❌ No access to form, stopping tests");
      return;
    }

    // 2. Get current owners
    const currentOwners = await formOwnerService.getFormOwners(formId);
    console.log("2. Current owners:", currentOwners);

    // 3. Test adding owner (only if user is the creator)
    if (initialAccess.isOwner) {
      console.log("3. Testing add owner...");
      try {
        const addResult = await formOwnerService.addFormOwner(
          formId,
          testEmail
        );
        console.log("✅ Add owner success:", addResult);
      } catch (error) {
        console.log("❌ Add owner failed:", error);
      }
    } else {
      console.log("3. Skipping add owner test (not primary owner)");
    }

    // 4. Get updated owners
    const updatedOwners = await formOwnerService.getFormOwners(formId);
    console.log("4. Updated owners:", updatedOwners);
  } catch (error) {
    console.error("Test Form Owner Management Error:", error);
  }

  console.log("=== End Testing ===");
};
