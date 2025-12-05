import { memo } from "react";
import { Button } from "@heroui/react";
import { FormOwner } from "../../services/formOwnerService";
import { CheckIcon, CloseIcon, StarIcon, UserIcon, UsersIcon } from "./Icons";

interface CollaboratorCardProps {
  user: FormOwner;
  isSelected: boolean;
  isSelectable: boolean;
  isCreator: boolean;
  isLoading: boolean;
  isCurrentUser: boolean;
  isDisabledForSelection?: boolean;
  onSelect?: (userId: string) => void;
  onRemove?: (
    userId: string,
    userName: string,
    userEmail: string
  ) => Promise<void>;
  showRole?: boolean;
  index: number;
}

const CollaboratorCard = memo(
  ({
    user,
    isSelected,
    isSelectable,
    isCreator,
    isLoading,
    isCurrentUser,
    isDisabledForSelection = false,
    onSelect,
    onRemove,
    showRole = false,
    index,
  }: CollaboratorCardProps) => {
    const handleRemoveClick = () => {
      onRemove?.(user._id, user.name, user.email);
    };

    const displayName = user.name || user.email?.split("@")[0] || "Unknown";

    // Determine if this card can actually be selected
    const canBeSelected = isSelectable && !isDisabledForSelection;

    return (
      <div
        className={`group collaboratorCard w-full rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${
          isSelected
            ? "bg-gradient-to-br from-primary via-primary-500 to-primary-600 text-white border-primary shadow-2xl scale-[1.02] ring-4 ring-primary/30 ring-offset-2 dark:ring-offset-gray-900"
            : isDisabledForSelection && isSelectable
            ? "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 opacity-60 cursor-not-allowed"
            : "bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-lg hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600"
        } ${
          canBeSelected
            ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            : ""
        }`}
        onClick={() => canBeSelected && onSelect?.(user._id)}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
        )}

        <div className="relative p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                  isSelected
                    ? "bg-white/20 backdrop-blur-sm text-white ring-2 ring-white/50"
                    : "bg-gradient-to-br from-primary to-secondary text-white ring-2 ring-primary/20"
                }`}
              >
                {(user.name || user.email).charAt(0).toUpperCase()}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                    isSelected
                      ? "bg-green-400 border-white"
                      : "bg-green-500 border-white dark:border-gray-800"
                  }`}
                />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h5
                  className={`text-sm font-bold break-words ${
                    isSelected
                      ? "text-white"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                  title={user.name || user.email}
                >
                  {displayName}
                </h5>
                <p
                  className={`text-xs mt-0.5 break-words ${
                    isSelected
                      ? "text-white/90"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {showRole && user.role && !user.isPrimary && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg capitalize shadow-sm transition-all ${
                    isSelected
                      ? "bg-white/20 backdrop-blur-sm text-white"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {user.role}
                </span>
              )}

              {isCreator && !user.isPrimary && !isSelectable && (
                <Button
                  size="sm"
                  isIconOnly
                  color="danger"
                  variant="flat"
                  className={`min-w-8 h-8 transition-all rounded-lg ${
                    isSelected
                      ? "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:scale-110"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  onPress={() => handleRemoveClick()}
                  disabled={isLoading}
                  title={`Remove ${displayName}`}
                >
                  <CloseIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 min-h-[24px]">
            {user.isPrimary && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-gray-900 font-bold px-3 py-1.5 rounded-lg shadow-md">
                <StarIcon className="w-3.5 h-3.5" />
                Creator
              </span>
            )}

            {isCurrentUser && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm ${
                  isSelected
                    ? "bg-white/20 backdrop-blur-sm text-white"
                    : "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                You
              </span>
            )}
          </div>

          {/* Selection Indicator */}
          {isSelectable && (
            <div className="absolute top-3 right-3">
              {isDisabledForSelection ? (
                <div className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Cannot select
                  </span>
                </div>
              ) : (
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-white border-white scale-110"
                      : "bg-transparent border-gray-300 dark:border-gray-600 group-hover:border-primary group-hover:scale-110"
                  }`}
                >
                  {isSelected && <CheckIcon className="w-4 h-4 text-primary" />}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover Effect */}
        {!isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 dark:group-hover:from-primary/10 dark:group-hover:to-primary/20 transition-all duration-300 rounded-xl pointer-events-none" />
        )}
      </div>
    );
  }
);

CollaboratorCard.displayName = "CollaboratorCard";

interface CollaboratorSectionProps {
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
  currentUserId?: string;
  excludeUserIds?: string[];
}

export const CollaboratorSection = memo(
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
    currentUserId,
    excludeUserIds = [],
  }: CollaboratorSectionProps) => {
    if (data.length === 0) {
      return (
        <div className="w-full text-center py-8 px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <UsersIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-semibold">
            No {title.toLowerCase()} found
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Add collaborators to expand your team
          </p>
        </div>
      );
    }

    return (
      <div className="w-full h-fit flex flex-col items-start gap-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 pl-1">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-600 rounded-full" />
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {title.split("(")[0].trim()}
          </h4>
          <div className="px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 text-primary dark:text-primary-400 text-sm font-bold rounded-full border border-primary/20 dark:border-primary/30 shadow-sm">
            {data.length}
          </div>
        </div>

        <div className="w-full flex flex-col gap-y-5">
          {data.map((user, index) => (
            <CollaboratorCard
              key={user._id}
              user={user}
              index={index}
              isSelected={user._id === isSelected}
              isSelectable={isSelectable}
              isCreator={isCreator}
              isLoading={isLoading}
              isCurrentUser={user._id === currentUserId}
              isDisabledForSelection={excludeUserIds.includes(user._id)}
              onSelect={onSelect}
              onRemove={onRemove}
              showRole={showRole}
            />
          ))}
        </div>
      </div>
    );
  }
);

CollaboratorSection.displayName = "CollaboratorSection";

export default CollaboratorCard;
