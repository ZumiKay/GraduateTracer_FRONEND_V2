import { memo } from "react";
import { Button, Tooltip } from "@heroui/react";
import { PendingCollaborator } from "../../services/formOwnerService";
import { ClockIcon, MailIcon, ResendIcon, TrashIcon } from "./Icons";

interface PendingCollaboratorCardProps {
  pending: PendingCollaborator;
  isLoading: boolean;
  onResend: (pendingId: string, email: string) => Promise<void>;
  onDelete: (pendingId: string, email: string) => Promise<void>;
  index: number;
}

const PendingCollaboratorCard = memo(
  ({
    pending,
    isLoading,
    onResend,
    onDelete,
    index,
  }: PendingCollaboratorCardProps) => {
    const displayName =
      pending.name || pending.email?.split("@")[0] || "Unknown";

    // Calculate time remaining
    const getTimeRemaining = () => {
      if (pending.isExpired) return "Expired";
      const remaining = pending.expireIn - Date.now();
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) return `${hours}h ${minutes}m remaining`;
      return `${minutes}m remaining`;
    };

    return (
      <div
        className={`group pendingCard w-full rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${
          pending.isExpired
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        } shadow-lg hover:shadow-xl`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="relative p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 shadow-lg ${
                  pending.isExpired
                    ? "bg-gradient-to-br from-red-400 to-red-600 text-white"
                    : "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                }`}
              >
                <MailIcon className="w-6 h-6" />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h5
                  className="text-sm font-bold break-words text-gray-900 dark:text-gray-100"
                  title={pending.name || pending.email}
                >
                  {displayName}
                </h5>
                <p
                  className="text-xs mt-0.5 break-words text-gray-500 dark:text-gray-400"
                  title={pending.email}
                >
                  {pending.email}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Tooltip content="Resend invitation" placement="top">
                <Button
                  size="sm"
                  isIconOnly
                  color="primary"
                  variant="flat"
                  className="min-w-8 h-8 transition-all rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:scale-110"
                  onPress={() => onResend(pending.pendingId, pending.email)}
                  disabled={isLoading}
                  aria-label={`Resend invitation to ${displayName}`}
                >
                  <ResendIcon className="w-4 h-4" />
                </Button>
              </Tooltip>

              <Tooltip content="Delete invitation" placement="top">
                <Button
                  size="sm"
                  isIconOnly
                  color="danger"
                  variant="flat"
                  className="min-w-8 h-8 transition-all rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:scale-110"
                  onPress={() => onDelete(pending.pendingId, pending.email)}
                  disabled={isLoading}
                  aria-label={`Delete invitation for ${displayName}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-wrap items-center gap-2 min-h-[24px]">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm ${
                pending.isExpired
                  ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-700/50"
                  : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50"
              }`}
            >
              <ClockIcon className="w-3.5 h-3.5" />
              {getTimeRemaining()}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              Pending
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PendingCollaboratorCard.displayName = "PendingCollaboratorCard";

interface PendingCollaboratorSectionProps {
  data: PendingCollaborator[];
  isLoading: boolean;
  onResend: (pendingId: string, email: string) => Promise<void>;
  onDelete: (pendingId: string, email: string) => Promise<void>;
}

export const PendingCollaboratorSection = memo(
  ({
    data,
    isLoading,
    onResend,
    onDelete,
  }: PendingCollaboratorSectionProps) => {
    if (data.length === 0) {
      return null;
    }

    return (
      <div className="w-full h-fit flex flex-col items-start gap-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 pl-1">
          <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Pending Invitations
          </h4>
          <div className="px-3 py-1 bg-gradient-to-r from-amber-400/10 to-amber-400/5 dark:from-amber-400/20 dark:to-amber-400/10 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-full border border-amber-400/20 dark:border-amber-400/30 shadow-sm">
            {data.length}
          </div>
        </div>

        <div className="w-full flex flex-col gap-y-5">
          {data.map((pending, index) => (
            <PendingCollaboratorCard
              key={pending._id}
              pending={pending}
              index={index}
              isLoading={isLoading}
              onResend={onResend}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  }
);

PendingCollaboratorSection.displayName = "PendingCollaboratorSection";

export default PendingCollaboratorCard;
