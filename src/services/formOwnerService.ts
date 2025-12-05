import ApiRequest from "../hooks/ApiHook";
import { CollaborateActionType, CollaboratorType } from "../types/Form.types";

export interface FormOwner {
  _id: string;
  name: string;
  email: string;
  role?: string;
  isPrimary?: boolean;
}

export interface PendingCollaborator {
  _id: string;
  pendingId: string;
  email: string;
  name: string;
  expireIn: number;
  isExpired: boolean;
  code: string;
}

export interface PendingOwnershipTransfer {
  _id: string;
  fromUser: {
    _id: string;
    email: string;
  };
  toUser: {
    _id: string;
    email: string;
  };
  expireIn: number;
  isExpired: boolean;
}

export interface FormAccessResponse {
  hasAccess: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
}

export interface FormOwnersResponse {
  primaryOwner: FormOwner;
  allOwners?: FormOwner[];
  allEditors?: FormOwner[];
  pendingCollaborators?: PendingCollaborator[];
  pendingOwnershipTransfer?: PendingOwnershipTransfer | null;
  totalCollaborators: number;
}

export const formOwnerService = {
  // Check if user has access to a form
  checkFormAccess: async (
    formId: string
  ): Promise<FormAccessResponse | null> => {
    try {
      const response = await ApiRequest({
        url: `/validateform?formId=${formId}`,
        method: "GET",
        cookie: true,
      });

      if (!response.success) return null;

      const data = response.data as FormAccessResponse;
      return {
        hasAccess: data?.hasAccess || false,
        isOwner: data?.isOwner || false,
        isCollaborator: data?.isCollaborator || false,
      };
    } catch (error) {
      console.error("Failed to check form access:", error);
      return null;
    }
  },

  // Get all owners of a form
  getFormOwners: async (formId: string) => {
    const response = await ApiRequest({
      url: `/getformowners/${formId}`,
      method: "GET",
      cookie: true,
    });

    return response;
  },

  // Add a new owner to a form
  addFormOwner: async (
    formId: string,
    email: string,
    role: CollaboratorType
  ) => {
    const response = await ApiRequest({
      url: `/addformowner`,
      method: "POST",
      data: {
        formId,
        email,
        action: CollaborateActionType.add,
        role,
      },
      cookie: true,
    });

    if (!response.success) throw response.error;

    return response;
  },

  // Remove an owner from a form (only primary owner can do this)
  removeFormOwner: async (
    formId: string,
    email: string,
    role: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/removeformowner`,
      method: "DELETE",
      data: { formId, email, action: CollaborateActionType.remove, role },
      cookie: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },

  // Remove self from a form
  removeSelfFromForm: async (
    formId: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/removeselfform/${formId}`,
      method: "DELETE",
      cookie: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },

  // Resend pending collaborator invitation
  resendPendingInvitation: async (
    formId: string,
    pendingId: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/resendpending`,
      method: "POST",
      data: { formId, pendingId },
      cookie: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },

  // Delete pending collaborator invitation
  deletePendingCollaborator: async (
    formId: string,
    pendingId: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/deletepending`,
      method: "DELETE",
      data: { formId, pendingId },
      cookie: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },

  // Transfer ownership (sends email invitation to new owner)
  transferOwnership: async (
    formId: string,
    userId: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/transferuser`,
      method: "PUT",
      data: { formId, userId },
      cookie: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },

  // Cancel pending ownership transfer
  cancelOwnershipTransfer: async (
    formId: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/ownership/cancel`,
      method: "DELETE",
      data: { formId },
      cookie: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },
};
