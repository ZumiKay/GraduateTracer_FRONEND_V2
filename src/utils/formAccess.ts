import { FormDataType } from "../types/Form.types";

export interface FormAccessInfo {
  hasAccess: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
  accessLevel: "owner" | "collaborator" | "none";
}

/**
 * Check if user has access to a form and return access information
 */
export const checkFormAccess = (formData: FormDataType): FormAccessInfo => {
  const isOwner = formData.isOwner || false;
  const isCollaborator = formData.isCollaborator || false;
  const hasAccess = isOwner || isCollaborator;

  let accessLevel: "owner" | "collaborator" | "none" = "none";
  if (isOwner) {
    accessLevel = "owner";
  } else if (isCollaborator) {
    accessLevel = "collaborator";
  }

  return {
    hasAccess,
    isOwner,
    isCollaborator,
    accessLevel,
  };
};

/**
 * Get access level display name
 */
export const getAccessLevelDisplay = (
  accessLevel: "owner" | "collaborator" | "none"
): string => {
  switch (accessLevel) {
    case "owner":
      return "Form Creator";
    case "collaborator":
      return "Collaborator";
    case "none":
    default:
      return "No Access";
  }
};

/**
 * Check if user can perform specific actions based on access level
 */
export const canPerformAction = (
  accessLevel: "owner" | "collaborator" | "none",
  action: "edit" | "delete" | "addOwner" | "removeOwner" | "view" | "respond"
): boolean => {
  switch (action) {
    case "view":
      return accessLevel === "owner" || accessLevel === "collaborator";
    case "edit":
      return accessLevel === "owner" || accessLevel === "collaborator";
    case "addOwner":
    case "removeOwner":
    case "delete":
      return accessLevel === "owner";
    case "respond":
      return true; // Anyone can respond to a form (if it's public)
    default:
      return false;
  }
};
