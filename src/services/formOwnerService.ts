import ApiRequest from "../hooks/ApiHook";

export interface FormOwner {
  _id: string;
  name: string;
  email: string;
  role?: string;
  isPrimary?: boolean;
}

export interface FormAccessResponse {
  hasAccess: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
}

export interface FormOwnersResponse {
  message: string;
  status: boolean;
  data: {
    primaryOwner: FormOwner;
    additionalOwners: FormOwner[];
    totalOwners: number;
  };
}

export interface AddOwnerResponse {
  message: string;
  data: {
    form: {
      _id: string;
      title: string;
      owners: string[];
    };
    addedUser: FormOwner;
  };
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
        refreshtoken: true,
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
  getFormOwners: async (formId: string): Promise<FormOwnersResponse | null> => {
    const response = await ApiRequest({
      url: `/getformowners/${formId}`,
      method: "GET",
      cookie: true,
      refreshtoken: true,
    });

    if (!response.success) throw response.error;

    return response as never;
  },

  // Add a new owner to a form
  addFormOwner: async (
    formId: string,
    email: string
  ): Promise<AddOwnerResponse | null> => {
    const response = await ApiRequest({
      url: `/addformowner`,
      method: "POST",
      data: { formId, userEmail: email },
      cookie: true,
      refreshtoken: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },

  // Remove an owner from a form (only primary owner can do this)
  removeFormOwner: async (
    formId: string,
    userId: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/removeformowner`,
      method: "DELETE",
      data: { formId, userId },
      cookie: true,
      refreshtoken: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },

  // Remove self from a form
  removeSelfFromForm: async (
    formId: string
  ): Promise<{ message: string } | null> => {
    const response = await ApiRequest({
      url: `/removeselfform`,
      method: "DELETE",
      data: { formId },
      cookie: true,
      refreshtoken: true,
    });

    if (!response.success) throw response.error;

    return response.data as never;
  },
};
