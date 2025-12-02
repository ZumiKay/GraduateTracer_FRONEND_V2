import React, { useState, useCallback, useMemo } from "react";
import {
  formOwnerService,
  FormOwner,
  FormOwnersResponse,
  PendingCollaborator,
} from "../../services/formOwnerService";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import ApiRequest from "../../hooks/ApiHook";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SuccessToast, { ErrorToast } from "../Modal/AlertModal";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { CollaboratorType } from "../../types/Form.types";
import { UsersIcon, GroupUsersIcon } from "./Icons";
import { AlertMessage } from "./AlertMessage";
import { AddCollaboratorForm } from "./AddCollaboratorForm";
import { CollaboratorSection } from "./CollaboratorCard";
import { PendingCollaboratorSection } from "./PendingCollaboratorCard";
import { useNavigate } from "react-router-dom";

interface FormOwnerManagerProps {
  onClose: () => void;
  isOpen: boolean;
}

enum ActionType {
  add = "Add",
  remove = "Remove",
  transfer = "Transfer",
  save = "Save",
}

const ModalHeaderContent = () => (
  <div className="flex items-center gap-3">
    <UsersIcon className="w-6 h-6 text-white" />
    <h3 className="text-xl font-bold text-white">Collaboration Management</h3>
  </div>
);

const FormOwnerManager: React.FC<FormOwnerManagerProps> = ({
  onClose,
  isOpen,
}) => {
  const {
    _id: formId,
    isOwner,
    isCreator,
    isEditor,
  } = useSelector((root: RootState) => root.allform.formstate);
  const navigate = useNavigate();
  const currentUser = useSelector((root: RootState) => root.usersession.user);
  const queryClient = useQueryClient();
  const hasFormAccess = isOwner || isCreator;
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [toBeAdd, setToBeAdd] = useState<string>();
  const [isAdd, setIsAdd] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    CollaboratorType | undefined
  >(isCreator ? undefined : CollaboratorType.editor);

  // Fetch owners using React Query
  const {
    data: ownersData,
    isLoading: isInitialLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["formOwners", formId],
    queryFn: async () => {
      const response = await formOwnerService.getFormOwners(formId as string);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch form owners");
      }

      const reqData = response.data as FormOwnersResponse;
      const allOwners: FormOwner[] = reqData.primaryOwner
        ? [reqData.primaryOwner]
        : [];
      if (reqData.allOwners) allOwners.push(...reqData.allOwners);

      return {
        owners: allOwners,
        editors: reqData.allEditors || [],
        pendingCollaborators: reqData.pendingCollaborators || [],
      };
    },
    enabled: !!formId && hasFormAccess,
    retry: 1,
  });

  // Derive state from query data
  const owners = useMemo(() => ownersData?.owners ?? [], [ownersData?.owners]);
  const editors = useMemo(
    () => ownersData?.editors ?? [],
    [ownersData?.editors]
  );
  const pendingCollaborators: PendingCollaborator[] = useMemo(
    () => ownersData?.pendingCollaborators ?? [],
    [ownersData?.pendingCollaborators]
  );

  // Compute error message from fetch error or local error state
  const displayError = fetchError
    ? (fetchError as Error).message
    : !formId
    ? "No form ID provided"
    : !hasFormAccess
    ? "You don't have access to view form owners"
    : error;

  const invalidateOwnersQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["formOwners", formId] });
  }, [queryClient, formId]);

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !newOwnerEmail.trim() || !selectedRole) {
      setError("Form ID, email and role are required");
      return;
    }
    if (!hasFormAccess) {
      setError("You don't have access to modify this form");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOwnerEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await formOwnerService.addFormOwner(
        formId,
        newOwnerEmail.trim(),
        selectedRole
      );
      if (response.message) {
        setSuccess(`${response.message} as a ${selectedRole}`);
        setNewOwnerEmail("");
        invalidateOwnersQuery();
      }
    } catch (err) {
      const error = err as string;
      setError(error || "Failed to add collaborator");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOwner = useCallback(
    async (userId: string, skipConfirmation = false) => {
      const isUser = owners.find((i) => i._id === userId);

      if (!formId || !hasFormAccess || !isCreator || !isUser || !isUser.role) {
        setError(
          !formId
            ? "Form ID is required"
            : !hasFormAccess
            ? "You don't have access to modify this form"
            : "Only the form creator can remove owners"
        );
        return;
      }
      if (
        !skipConfirmation &&
        !confirm("Are you sure you want to remove this collaborator?")
      )
        return;

      setIsLoading(true);
      setError("");
      setSuccess("");

      try {
        await formOwnerService.removeFormOwner(
          formId,
          isUser.email,
          isUser.role
        );
        setSuccess("Collaborator removed successfully");

        //Refetch the data
        invalidateOwnersQuery();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(
          error.response?.data?.message || "Failed to remove collaborator"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [owners, formId, hasFormAccess, isCreator, invalidateOwnersQuery]
  );

  const handleRemoveSelf = async () => {
    if (!formId || !hasFormAccess) {
      setError(
        !formId ? "Form ID is required" : "You don't have access to this form"
      );
      return;
    }
    if (isCreator) {
      setError(
        "Form creators cannot remove themselves. Please transfer ownership first."
      );
      return;
    }
    if (
      !confirm(
        "Are you sure you want to remove yourself from this form? You will lose access to it."
      )
    )
      return;

    setIsLoading(true);
    setError("");

    try {
      await formOwnerService.removeSelfFromForm(formId);
      setSuccess("Successfully removed from form");
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to remove from form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeCreator = useCallback(async () => {
    if (!formId || !toBeAdd) {
      setError("Missing required information");
      return;
    }
    if (!isChanging) {
      setIsChanging(true);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const changeRequest = await ApiRequest({
        method: "PUT",
        url: "/transferuser",
        data: { formId, userId: toBeAdd },
      });
      setIsLoading(false);
      if (!changeRequest.success) {
        ErrorToast({
          title: "Error",
          content: changeRequest.error ?? "Error Occurred",
        });
        return;
      }
      SuccessToast({ title: "Success", content: "Transfer Complete" });
      invalidateOwnersQuery();
      setIsChanging(false);
      setToBeAdd(undefined);
    } catch (err: unknown) {
      setIsLoading(false);
      setError(
        err instanceof Error ? err.message : "Failed to transfer ownership"
      );
    }
  }, [invalidateOwnersQuery, formId, isChanging, toBeAdd]);

  const handleAction = useCallback(
    async (key: ActionType) => {
      switch (key) {
        case ActionType.add:
          setIsAdd(true);
          break;
        case ActionType.transfer:
          setIsChanging(true);
          break;
        case ActionType.remove:
          if (toBeAdd) {
            await handleRemoveOwner(toBeAdd);
            setToBeAdd(undefined);
          }
          break;
        case ActionType.save:
          if (isChanging) {
            await handleChangeCreator();
            setIsChanging(false);
            setToBeAdd(undefined);
          }
          break;
      }
    },
    [toBeAdd, isChanging, handleRemoveOwner, handleChangeCreator]
  );

  const handleCloseAdd = useCallback(() => {
    setIsAdd(false);
    setNewOwnerEmail("");
    setError("");
    setSuccess("");
  }, []);

  const handleCardRemove = useCallback(
    async (userId: string, userName: string, userEmail: string) => {
      const displayName = userName || userEmail?.split("@")[0] || "this user";
      if (
        confirm(
          `Are you sure you want to remove ${displayName} from this form?`
        )
      ) {
        await handleRemoveOwner(userId, true);
      }
    },
    [handleRemoveOwner]
  );

  const handleResendPending = useCallback(
    async (pendingId: string, email: string) => {
      if (!formId) {
        setError("Form ID is required");
        return;
      }

      setIsLoading(true);
      setError("");
      setSuccess("");

      try {
        await formOwnerService.resendPendingInvitation(formId, pendingId);
        setSuccess(`Invitation resent to ${email}`);
        invalidateOwnersQuery();
      } catch (err) {
        const error = err as string;
        setError(error || "Failed to resend invitation");
      } finally {
        setIsLoading(false);
      }
    },
    [formId, invalidateOwnersQuery]
  );

  const handleDeletePending = useCallback(
    async (pendingId: string, email: string) => {
      if (!formId) {
        setError("Form ID is required");
        return;
      }

      if (
        !confirm(
          `Are you sure you want to delete the pending invitation for ${email}?`
        )
      ) {
        return;
      }

      setIsLoading(true);
      setError("");
      setSuccess("");

      try {
        await formOwnerService.deletePendingCollaborator(formId, pendingId);
        setSuccess("Pending invitation deleted successfully");
        invalidateOwnersQuery();
      } catch (err) {
        const error = err as string;
        setError(error || "Failed to delete pending invitation");
      } finally {
        setIsLoading(false);
      }
    },
    [formId, invalidateOwnersQuery]
  );

  const shouldShowAction = (action: ActionType): boolean => {
    switch (action) {
      case ActionType.save:
        return isChanging && !!isCreator && !!toBeAdd;
      case ActionType.add:
        return !!hasFormAccess;
      case ActionType.remove:
        return !!isCreator && !!toBeAdd && !isChanging;
      case ActionType.transfer:
        return !!isCreator && !isChanging;
      default:
        return true;
    }
  };

  if (isInitialLoading) {
    return (
      <Modal size="xl" isOpen={isOpen} onOpenChange={() => onClose()}>
        <ModalContent className="dark:bg-gray-900">
          <ModalHeader className="bg-gradient-to-r from-primary to-secondary">
            <ModalHeaderContent />
          </ModalHeader>
          <ModalBody className="dark:bg-gray-900">
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal size="xl" isOpen={isOpen} onOpenChange={() => onClose()}>
      <ModalContent className="dark:bg-gray-900">
        <ModalHeader className="bg-gradient-to-r from-primary to-secondary">
          <ModalHeaderContent />
        </ModalHeader>
        <ModalBody className="pb-6 dark:bg-gray-900">
          <div className="w-full h-full bg-white dark:bg-gray-800 space-y-6">
            {displayError && (
              <AlertMessage message={displayError} type="error" />
            )}
            {success && <AlertMessage message={success} type="success" />}

            {isAdd ? (
              <AddCollaboratorForm
                newOwnerEmail={newOwnerEmail}
                setNewOwnerEmail={setNewOwnerEmail}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                onSubmit={handleAddOwner}
                onClose={handleCloseAdd}
                isLoading={isLoading}
                isCreator={isCreator}
              />
            ) : (
              <>
                <div className="btnSection w-full h-fit flex flex-row gap-3 flex-wrap p-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                  {hasFormAccess &&
                    !isEditor &&
                    Object.values(ActionType).map(
                      (action, idx) =>
                        shouldShowAction(action) && (
                          <Button
                            key={idx}
                            type="button"
                            size="sm"
                            className="text-white"
                            color={
                              action === ActionType.save ? "success" : "primary"
                            }
                            variant="solid"
                            onPress={() => handleAction(action)}
                            disabled={isLoading}
                          >
                            {action === ActionType.save && isLoading
                              ? "Saving..."
                              : action}
                          </Button>
                        )
                    )}
                  {isChanging && (
                    <Button
                      color="danger"
                      className="font-bold text-white"
                      size="sm"
                      onPress={() => setIsChanging(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {isChanging && (
                  <AlertMessage
                    message="Select a collaborator to transfer ownership to, then click 'Save' to confirm."
                    type="info"
                  />
                )}

                <div className="space-y-6 p-2">
                  {owners.length > 0 && !isChanging && (
                    <CollaboratorSection
                      title={`Owners (${owners.length})`}
                      data={owners}
                      isSelected={toBeAdd}
                      onSelect={
                        isChanging
                          ? (id) => setToBeAdd(id === toBeAdd ? undefined : id)
                          : undefined
                      }
                      showRole
                      isSelectable={isChanging}
                      isCreator={isCreator}
                      onRemove={handleCardRemove}
                      isLoading={isLoading}
                      currentUserId={currentUser?._id}
                    />
                  )}

                  {editors.length > 0 && !isChanging && (
                    <CollaboratorSection
                      title={`Editors (${editors.length})`}
                      data={editors}
                      isSelected={toBeAdd}
                      onSelect={
                        isChanging
                          ? (id) => setToBeAdd(id === toBeAdd ? undefined : id)
                          : undefined
                      }
                      showRole
                      isSelectable={isChanging}
                      isCreator={isCreator}
                      onRemove={handleCardRemove}
                      isLoading={isLoading}
                      currentUserId={currentUser?._id}
                    />
                  )}

                  {pendingCollaborators.length > 0 &&
                    !isChanging &&
                    isCreator && (
                      <PendingCollaboratorSection
                        data={pendingCollaborators}
                        isLoading={isLoading}
                        onResend={handleResendPending}
                        onDelete={handleDeletePending}
                      />
                    )}

                  {owners.length === 0 && editors.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <GroupUsersIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        No collaborators found
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        Add collaborators to start working together
                      </p>
                    </div>
                  )}
                </div>

                {!isCreator && hasFormAccess && (
                  <div className="border-t pt-4 mt-6">
                    <Button
                      color="danger"
                      variant="bordered"
                      size="sm"
                      onPress={handleRemoveSelf}
                      disabled={isLoading}
                    >
                      Remove Myself from Form
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default FormOwnerManager;
