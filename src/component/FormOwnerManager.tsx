import React, { useState, useEffect, useCallback, memo } from "react";
import {
  formOwnerService,
  FormOwner,
  FormOwnersResponse,
} from "../services/formOwnerService";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import ApiRequest from "../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "./Modal/AlertModal";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";

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

const FormOwnerManager: React.FC<FormOwnerManagerProps> = ({
  onClose,
  isOpen,
}) => {
  const {
    _id: formId,
    isOwner,
    isCreator,
  } = useSelector((root: RootState) => root.allform.formstate);

  const hasFormAccess = isOwner || isCreator;
  const [owners, setOwners] = useState<FormOwner[]>([]);
  const [editors, seteditors] = useState<FormOwner[]>([]);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isChanging, setisChanging] = useState<boolean>();
  const [toBeAdd, settoBeAdd] = useState<string>();
  const [isAdd, setisAdd] = useState<boolean>(false);

  const fetchOwners = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const response = await formOwnerService.getFormOwners(formId as string);
      setIsInitialLoading(false);

      if (!response.success) {
        console.error("Failed to fetch form owners:", response.error);
        setError(response.error || "Failed to fetch form owners");
        setOwners([]);
        seteditors([]);
        return;
      }

      if (response.success) {
        const reqData = response.data as FormOwnersResponse;
        const allOwners: FormOwner[] = [];
        const allEditors: FormOwner[] = [];

        if (reqData.primaryOwner) {
          allOwners.push(reqData.primaryOwner);
        }
        if (reqData.allOwners) {
          allOwners.push(...reqData.allOwners);
        }
        if (reqData.allEditors) {
          allEditors.push(...reqData.allEditors);
        }

        setOwners(allOwners);
        seteditors(allEditors);
        setError("");
      }
    } catch (error: unknown) {
      setIsInitialLoading(false);
      console.error("Failed to fetch form owners:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch form owners";
      setError(errorMessage);
      setOwners([]);
      seteditors([]);
    }
  }, [formId]);

  useEffect(() => {
    if (formId && hasFormAccess) {
      fetchOwners();
    } else if (formId && !hasFormAccess) {
      setIsInitialLoading(false);
      setError("You don't have access to view form owners");
    } else {
      setIsInitialLoading(false);
      setError("No form ID provided");
    }
  }, [formId, hasFormAccess, fetchOwners]);

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formId || !newOwnerEmail.trim()) {
      setError("Form ID and email are required");
      return;
    }

    if (!hasFormAccess) {
      setError("You don't have access to modify this form");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newOwnerEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await formOwnerService.addFormOwner(
        formId,
        newOwnerEmail.trim()
      );

      if (response) {
        setSuccess(
          `Successfully added ${
            response.data.addedUser.name || response.data.addedUser.email
          } as a collaborator`
        );
        setNewOwnerEmail("");
        await fetchOwners();

        setTimeout(() => {
          setisAdd(false);
        }, 2000);
      }
    } catch (error: unknown) {
      console.error("Failed to add owner:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to add collaborator");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOwner = useCallback(
    async (userId: string, skipConfirmation = false) => {
      if (!formId) {
        setError("Form ID is required");
        return;
      }

      if (!hasFormAccess) {
        setError("You don't have access to modify this form");
        return;
      }

      if (!isCreator) {
        setError("Only the form creator can remove owners");
        return;
      }

      // Skip confirmation if it was already handled by the calling component
      if (
        !skipConfirmation &&
        !confirm("Are you sure you want to remove this collaborator?")
      ) {
        return;
      }

      setIsLoading(true);
      setError("");
      setSuccess("");

      try {
        await formOwnerService.removeFormOwner(formId, userId);
        setSuccess("Collaborator removed successfully");
        await fetchOwners();
      } catch (error: unknown) {
        console.error("Failed to remove owner:", error);
        const err = error as { response?: { data?: { message?: string } } };
        setError(
          err.response?.data?.message || "Failed to remove collaborator"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [formId, hasFormAccess, isCreator, fetchOwners]
  );

  const handleRemoveSelf = async () => {
    if (!formId) {
      setError("Form ID is required");
      return;
    }

    if (!hasFormAccess) {
      setError("You don't have access to this form");
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
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: unknown) {
      console.error("Failed to remove from form:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to remove from form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOwner = useCallback(
    (userId: string) => {
      if (toBeAdd && toBeAdd === userId) {
        // Deselect if clicking the same user
        settoBeAdd(undefined);
        return;
      }
      // Select the user
      settoBeAdd(userId);
    },
    [toBeAdd]
  );

  //Change Form Creator
  const handleChangeCreator = useCallback(async () => {
    if (!formId || !toBeAdd) {
      setError("Missing required information");
      return;
    }
    if (!isChanging) {
      setisChanging(true);
      return;
    }

    //change request
    setIsLoading(true);
    setError("");
    try {
      const changeRequest = await ApiRequest({
        method: "PUT",
        url: "/transferuser",
        data: {
          formId,
          userId: toBeAdd,
        },
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
      await fetchOwners();
      setisChanging(false);
      settoBeAdd(undefined);
    } catch (error: unknown) {
      setIsLoading(false);
      console.error("Failed to transfer ownership:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to transfer ownership";
      setError(errorMessage);
    }
  }, [fetchOwners, formId, isChanging, toBeAdd]);

  const handleAction = useCallback(
    async (key: ActionType) => {
      switch (key) {
        case ActionType.add:
          setisAdd(true);
          break;

        case ActionType.transfer:
          setisChanging(true);
          break;

        case ActionType.remove:
          if (toBeAdd) {
            await handleRemoveOwner(toBeAdd);
            settoBeAdd(undefined);
          }
          break;

        case ActionType.save:
          if (isChanging) {
            await handleChangeCreator();
            setisChanging(false);
            settoBeAdd(undefined);
          }
          break;

        default:
          break;
      }
    },
    [toBeAdd, isChanging, handleRemoveOwner, handleChangeCreator]
  );

  const handleCloseAdd = useCallback(() => {
    setisAdd(false);
    setNewOwnerEmail("");
    setError("");
    setSuccess("");
  }, []);

  // Wrapper function for card remove buttons with confirmation
  const handleCardRemove = useCallback(
    async (userId: string, userName: string, userEmail: string) => {
      const displayName = userName || userEmail?.split("@")[0] || "this user";
      if (
        confirm(
          `Are you sure you want to remove ${displayName} from this form?`
        )
      ) {
        await handleRemoveOwner(userId, true); // Skip confirmation since we already confirmed
      }
    },
    [handleRemoveOwner]
  );

  if (isInitialLoading) {
    return (
      <Modal size="xl" isOpen={isOpen} onOpenChange={() => onClose()}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-black">
              Collaboration Management
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal size="xl" isOpen={isOpen} onOpenChange={() => onClose()}>
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-bold text-black">
            Collaboration Management
          </h3>
        </ModalHeader>
        <ModalBody className="pb-6">
          <div className="w-full h-full bg-white space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {isAdd ? (
              <div className="Add_container space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-black">
                    Add New Collaborator
                  </h4>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={handleCloseAdd}
                    className="text-gray-500"
                  >
                    ✕
                  </Button>
                </div>

                <form onSubmit={handleAddOwner} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      placeholder="Enter collaborator's email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      color="primary"
                      disabled={isLoading || !newOwnerEmail.trim()}
                      className="flex-1"
                    >
                      {isLoading ? "Adding..." : "Add Collaborator"}
                    </Button>
                    <Button
                      type="button"
                      variant="bordered"
                      onPress={handleCloseAdd}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Action Buttons */}
                <div className="btnSection w-full h-fit flex flex-row gap-x-3 flex-wrap">
                  {hasFormAccess &&
                    Object.values(ActionType).map(
                      (i, idx) =>
                        (i === ActionType.save
                          ? isChanging && isCreator && toBeAdd
                          : i === ActionType.add
                          ? isCreator
                          : i === ActionType.remove
                          ? isCreator && toBeAdd && !isChanging
                          : i === ActionType.transfer
                          ? isCreator && !isChanging
                          : true) && (
                          <Button
                            key={idx}
                            type="button"
                            size="sm"
                            className="text-black"
                            color={
                              i === ActionType.save ? "success" : "primary"
                            }
                            variant={
                              i === ActionType.save ? "solid" : "bordered"
                            }
                            onPress={() => handleAction(i)}
                            disabled={isLoading}
                          >
                            {i === ActionType.save && isLoading
                              ? "Saving..."
                              : i}
                          </Button>
                        )
                    )}
                </div>

                {/* Instructions */}
                {isChanging && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-blue-600 text-sm">
                      Select a collaborator to transfer ownership to, then click
                      "Save" to confirm.
                    </p>
                  </div>
                )}

                {/* Collaborators Sections */}
                <div className="space-y-6">
                  {owners.length > 0 && (
                    <CollarboratorItem
                      title={`Owners (${owners.length})`}
                      data={owners}
                      isSelected={toBeAdd}
                      onSelect={isChanging ? handleSelectOwner : undefined}
                      showRole={true}
                      isSelectable={isChanging}
                      isCreator={isCreator}
                      onRemove={handleCardRemove}
                      isLoading={isLoading}
                    />
                  )}

                  {editors.length > 0 && (
                    <CollarboratorItem
                      title={`Editors (${editors.length})`}
                      data={editors}
                      isSelected={toBeAdd}
                      onSelect={isChanging ? handleSelectOwner : undefined}
                      showRole={true}
                      isSelectable={isChanging}
                      isCreator={isCreator}
                      onRemove={handleCardRemove}
                      isLoading={isLoading}
                    />
                  )}

                  {owners.length === 0 && editors.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No collaborators found</p>
                    </div>
                  )}
                </div>

                {/* Self-remove option for non-creators */}
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

const CollarboratorItem = memo(
  ({
    title,
    data,
    isSelected,
    onSelect,
    showRole = false,
    isSelectable = false,
    isCreator = false,
    onRemove,
    isLoading = false,
  }: {
    title: string;
    data: FormOwner[];
    isSelected?: string;
    onSelect?: (userId: string) => void;
    showRole?: boolean;
    isSelectable?: boolean;
    isCreator?: boolean;
    onRemove?: (
      userId: string,
      userName: string,
      userEmail: string
    ) => Promise<void>;
    isLoading?: boolean;
  }) => {
    const handleRemoveClick = (
      userId: string,
      userName: string,
      userEmail: string
    ) => {
      onRemove?.(userId, userName, userEmail);
    };

    return (
      <div className="w-full h-fit flex flex-col items-start gap-y-4">
        <p className="text-left text-lg font-medium text-gray-800">{title}</p>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((user) => (
            <div
              key={user._id}
              className={`collaboratorCard w-full p-4 rounded-lg border transition-all duration-200 relative ${
                user._id === isSelected
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-gray-50 hover:bg-gray-100 border-gray-200"
              } ${
                isSelectable
                  ? "cursor-pointer hover:shadow-md"
                  : "cursor-default"
              }`}
              onClick={() => isSelectable && onSelect?.(user._id)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold break-words flex-1 mr-2">
                    {user.name || user.email?.split("@")[0] || "Unknown"}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.isPrimary && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Creator
                      </span>
                    )}
                    {/* Remove button - only show for creator and non-primary users */}
                    {isCreator && !user.isPrimary && !isSelectable && (
                      <Button
                        size="sm"
                        isIconOnly
                        color="danger"
                        variant="light"
                        className={`min-w-6 h-6 transition-all ${
                          user._id === isSelected
                            ? "text-white hover:bg-red-500/20"
                            : "text-red-500 hover:bg-red-100 hover:text-red-700"
                        } ${isLoading ? "opacity-50" : ""}`}
                        onPress={() =>
                          handleRemoveClick(user._id, user.name, user.email)
                        }
                        disabled={isLoading}
                        title={`Remove ${
                          user.name || user.email?.split("@")[0] || "user"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs opacity-75 break-words">{user.email}</p>
                {showRole && user.role && (
                  <p className="text-xs opacity-75 capitalize">{user.role}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="w-full text-center py-4 text-gray-500 italic">
            No {title.toLowerCase()} found
          </div>
        )}
      </div>
    );
  }
);

CollarboratorItem.displayName = "CollarboratorItem";
