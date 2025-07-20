import React, { useState, useEffect, useCallback } from "react";
import { formOwnerService, FormOwner } from "../services/formOwnerService";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

interface FormOwnerManagerProps {
  onClose: () => void;
}

const FormOwnerManager: React.FC<FormOwnerManagerProps> = ({ onClose }) => {
  const {
    _id: formId,
    isOwner: isFormCreator,
    isCollaborator,
  } = useSelector((root: RootState) => root.allform.formstate);

  // Check if user has any form access (either creator or collaborator)
  const hasFormAccess = isFormCreator || isCollaborator;
  const [owners, setOwners] = useState<FormOwner[]>([]);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOwners = useCallback(async () => {
    console.log("Fetching owners for form:", formId);
    console.log("Form access:", {
      isFormCreator,
      isCollaborator,
      hasFormAccess,
    });
    try {
      const response = await formOwnerService.getFormOwners(formId as string);
      if (response?.data) {
        const allOwners = [];
        if (response.data.primaryOwner) {
          allOwners.push(response.data.primaryOwner);
        }
        if (
          response.data.additionalOwners &&
          response.data.additionalOwners.length > 0
        ) {
          allOwners.push(...response.data.additionalOwners);
        }
        console.log(allOwners);
        setOwners(allOwners);
      } else {
        setOwners([]);
      }
      setError("");
    } catch (error: unknown) {
      console.error("Failed to fetch form owners:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to fetch form owners");
      setOwners([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, [formId, isFormCreator, isCollaborator, hasFormAccess]);

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

    if (!isFormCreator) {
      setError("Only the form creator can add new owners");
      return;
    }

    console.log("Adding owner:", { formId, email: newOwnerEmail.trim() });
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await formOwnerService.addFormOwner(
        formId,
        newOwnerEmail.trim()
      );
      console.log("Add owner response:", response);

      if (response?.data) {
        setSuccess(
          `Successfully added ${response.data.addedUser.name} as an owner`
        );
        setNewOwnerEmail("");
        await fetchOwners();
      }
    } catch (error: unknown) {
      console.error("Failed to add owner:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to add owner");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOwner = async (userId: string) => {
    if (!formId) {
      setError("Form ID is required");
      return;
    }

    if (!hasFormAccess) {
      setError("You don't have access to modify this form");
      return;
    }

    if (!isFormCreator) {
      setError("Only the form creator can remove owners");
      return;
    }

    if (!confirm("Are you sure you want to remove this owner?")) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await formOwnerService.removeFormOwner(formId, userId);
      setSuccess("Owner removed successfully");
      await fetchOwners();
    } catch (error: unknown) {
      console.error("Failed to remove owner:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to remove owner");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSelf = async () => {
    if (!formId) {
      setError("Form ID is required");
      return;
    }

    if (!hasFormAccess) {
      setError("You don't have access to this form");
      return;
    }

    if (isFormCreator) {
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
      // Close the modal after a brief delay to show the success message
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Form Access Management</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {!formId && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            No form selected. Please select a form first.
          </div>
        )}

        {formId && !hasFormAccess && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            You don't have access to manage this form. Only the form creator and
            collaborators can manage form access.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Add Owner Form - Only form creators can add owners */}
        {formId && hasFormAccess && isFormCreator && (
          <form onSubmit={handleAddOwner} className="mb-6">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add New Collaborator
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Enter the email address of the person you want to add as a
                collaborator
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
              <button
                type="submit"
                disabled={isLoading || !newOwnerEmail.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Adding..." : "Add Owner"}
              </button>
            </div>
          </form>
        )}

        {/* Current Owners List - Show for all users with access */}
        {formId && hasFormAccess && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Current Owners</h3>
            {isInitialLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading owners...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {owners.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No owners found
                  </div>
                ) : (
                  owners.map((owner) => (
                    <div
                      key={owner._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {owner.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {owner.email}
                        </div>
                        {owner.role && (
                          <div className="text-xs text-blue-600 mt-1">
                            {owner.role === "creator"
                              ? "Form Creator"
                              : "Collaborator"}
                          </div>
                        )}
                      </div>
                      {/* Only form creators can remove collaborators */}
                      {isFormCreator && owner.role !== "creator" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOwner(owner._id)}
                          disabled={isLoading}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Remove Self Button (for collaborators only) */}
        {formId && hasFormAccess && !isFormCreator && (
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={handleRemoveSelf}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300"
            >
              {isLoading ? "Removing..." : "Remove Myself from Form"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormOwnerManager;
