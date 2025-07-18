import { checkFormAccess, canPerformAction } from "../utils/formAccess";
import { FormDataType } from "../types/Form.types";
import { debugFormAccess } from "../utils/formOwnerDebug";

// Test function to validate form access functionality
export const testFormAccessSystem = async (formId: string) => {
  console.log("=== Testing Form Access System ===");

  // Test 1: Debug form access
  console.log("1. Testing form access debug...");
  await debugFormAccess(formId);

  // Test 2: Mock form data to test access utilities
  console.log("2. Testing access utilities...");

  // Test owner access
  const ownerForm: Partial<FormDataType> = {
    _id: formId,
    isOwner: true,
    isCollaborator: false,
    title: "Test Form (Owner)",
  };

  const ownerAccess = checkFormAccess(ownerForm as FormDataType);
  console.log("Owner access:", ownerAccess);
  console.log(
    "Owner can edit:",
    canPerformAction(ownerAccess.accessLevel, "edit")
  );
  console.log(
    "Owner can add owners:",
    canPerformAction(ownerAccess.accessLevel, "addOwner")
  );
  console.log(
    "Owner can delete:",
    canPerformAction(ownerAccess.accessLevel, "delete")
  );

  // Test collaborator access
  const collaboratorForm: Partial<FormDataType> = {
    _id: formId,
    isOwner: false,
    isCollaborator: true,
    title: "Test Form (Collaborator)",
  };

  const collaboratorAccess = checkFormAccess(collaboratorForm as FormDataType);
  console.log("Collaborator access:", collaboratorAccess);
  console.log(
    "Collaborator can edit:",
    canPerformAction(collaboratorAccess.accessLevel, "edit")
  );
  console.log(
    "Collaborator can add owners:",
    canPerformAction(collaboratorAccess.accessLevel, "addOwner")
  );
  console.log(
    "Collaborator can delete:",
    canPerformAction(collaboratorAccess.accessLevel, "delete")
  );

  // Test no access
  const noAccessForm: Partial<FormDataType> = {
    _id: formId,
    isOwner: false,
    isCollaborator: false,
    title: "Test Form (No Access)",
  };

  const noAccess = checkFormAccess(noAccessForm as FormDataType);
  console.log("No access:", noAccess);
  console.log(
    "No access can view:",
    canPerformAction(noAccess.accessLevel, "view")
  );
  console.log(
    "No access can edit:",
    canPerformAction(noAccess.accessLevel, "edit")
  );

  console.log("=== Form Access System Test Complete ===");
};

// Function to add to window for easy testing in browser console
export const addTestToWindow = () => {
  const globalWindow = window as unknown as Window & {
    testFormAccess: typeof testFormAccessSystem;
  };
  globalWindow.testFormAccess = testFormAccessSystem;
  console.log(
    "Added testFormAccess function to window. Usage: testFormAccess('formId')"
  );
};
