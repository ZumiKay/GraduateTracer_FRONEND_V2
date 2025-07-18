import useImprovedAutoSave from "./useImprovedAutoSave";

const AutoSaveForm = () => {
  const { autoSaveStatus } = useImprovedAutoSave({
    debounceMs: 500,
    retryAttempts: 3,
    retryDelayMs: 2000,
  });

  return (
    <div className="Saveindcator w-[150px] h-full text-md font-normal">
      {autoSaveStatus.status === "saving" ? (
        <p className="animate-pulse">
          {autoSaveStatus.retryCount > 0
            ? `Retrying... (${autoSaveStatus.retryCount})`
            : "Saving..."}
        </p>
      ) : autoSaveStatus.status === "error" ? (
        <p className="text-red-500">Save failed</p>
      ) : autoSaveStatus.status === "offline" ? (
        <p className="text-orange-500">Offline</p>
      ) : (
        "Saved"
      )}
    </div>
  );
};

export default AutoSaveForm;
