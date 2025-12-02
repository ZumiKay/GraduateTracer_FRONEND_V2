import { Button } from "@heroui/react";
import { CSSProperties, useState, useCallback, memo, useMemo } from "react";
import { toast, ToastContentProps } from "react-toastify";
import ModalWrapper from "./Modal";
import { useSelector, shallowEqual } from "react-redux";
import { RootState } from "../../redux/store";
import { ApiRequestReturnType } from "../../hooks/ApiHook";

type ToastContenttype = {
  title: string;
  content: string;
  type?: toasttype;
  toastid?: string;
  btn?: {
    content: string;
    color: CSSProperties;
    onClick?: () => void;
  };
};

type toasttype = "error" | "info" | "success";

type CustomNotificationProps = ToastContentProps<ToastContenttype>;
const CustomNofication = ({ data }: CustomNotificationProps) => {
  return (
    <div className={`flex flex-col items-start w-full gap-y-5`}>
      <h3 className="text-xl font-bold">{data.title}</h3>
      <div className="flex flex-col items-start gap-y-3 w-full">
        <p className="text-sm text-center">{data.content}</p>
        {data.btn && (
          <Button
            variant="bordered"
            onPress={() => data.btn?.onClick && data.btn?.onClick()}
            color={
              data.type === "success"
                ? "success"
                : data.type === "info"
                ? "primary"
                : "danger"
            }
          >
            {data.btn.content}
          </Button>
        )}
      </div>
    </div>
  );
};

export default function SuccessToast(data: ToastContenttype) {
  const toastId = "uniqusuccesstoastid";

  if (toast.isActive(toastId)) {
    toast.dismiss(toastId);
  }
  return toast.success(CustomNofication, {
    toastId,
    data: { ...data, type: "success" },
    autoClose: 3000,
    ariaLabel: "success toast",
    icon: false,
  });
}

export function ErrorToast(data: ToastContenttype) {
  return toast(CustomNofication, {
    toastId: data.toastid,
    data: { ...data, type: "error" },
    autoClose: 3000,
    hideProgressBar: true,
    closeButton: true,
    style: { backgroundColor: "red", color: "white" },
  });
}
export function InfoToast(data: ToastContenttype) {
  const toastId = "uniquinfotoastid";

  if (toast.isActive(toastId)) {
    toast.dismiss(toastId);
  }
  return toast.info(CustomNofication, {
    toastId,
    data: { ...data, type: "info" },
    autoClose: 2000,
    closeButton: true,
  });
}

export const PromiseToast = (
  data: { promise: Promise<ApiRequestReturnType> },
  custom?: { pending?: string; success?: string; error?: string }
) => {
  const toastId = "uniquepromise";
  if (toast.isActive(toastId)) toast.dismiss(toastId);

  let showToast = true;

  const delayPromise = new Promise<ApiRequestReturnType>((resolve, reject) => {
    if (showToast) {
      toast.promise(
        data.promise.then((res) => {
          if (!res.success) reject(res);
          resolve(res);
        }),
        {
          pending: custom?.pending ?? "Loading...",
          success: custom?.success,
          error: custom?.error ?? "Error Occurred",
        },
        {
          toastId,
          position: "bottom-right",
          autoClose: 2000,
          closeOnClick: true,
          closeButton: true,
        }
      );
    }

    data.promise
      .then((res) => {
        if (!res.success) {
          reject(res);
          return;
        }

        showToast = false; // Prevent toast from showing if completed in <1s
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });

  return delayPromise;
};

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
};

// Memoized selector to prevent unnecessary re-renders
const selectConfirmData = (root: RootState) => root.openmodal.confirm.data;
const selectSaveFormLoading = (root: RootState) => root.allform.loading;

// Memoized button component to prevent re-creation on parent re-renders
const ConfirmModalButtons = memo(function ConfirmModalButtons({
  isLoadingOrSaving,
  agreeLabel,
  disagreeLabel,
  onAgree,
  onDisagree,
}: {
  isLoadingOrSaving: boolean;
  agreeLabel: string;
  disagreeLabel: string;
  onAgree: () => void;
  onDisagree: () => void;
}) {
  return (
    <div
      className="btn_container flex gap-3 items-center justify-end w-full"
      role="group"
      aria-label="Confirmation actions"
    >
      <Button
        color="danger"
        onPress={onDisagree}
        className="font-semibold min-w-24"
        variant="light"
        disabled={isLoadingOrSaving}
        aria-label={`Disagree: ${disagreeLabel}`}
      >
        {disagreeLabel}
      </Button>
      <Button
        color="success"
        onPress={onAgree}
        className="font-semibold min-w-24"
        isLoading={isLoadingOrSaving}
        variant="flat"
        disabled={isLoadingOrSaving}
        aria-label={`Agree: ${agreeLabel}`}
      >
        {agreeLabel}
      </Button>
    </div>
  );
});

/**
 * ConfirmModal Component
 * Optimized with memoization and stable callbacks
 */
export const ConfirmModal = memo(function ConfirmModal(
  props: ConfirmModalProps
) {
  const confirmdata = useSelector(selectConfirmData, shallowEqual);
  const saveformLoading = useSelector(selectSaveFormLoading);
  const [loading, setloading] = useState(false);

  // Memoized button labels
  const agreeLabel = useMemo(
    () => confirmdata?.btn?.agree ?? "Yes",
    [confirmdata?.btn?.agree]
  );
  const disagreeLabel = useMemo(
    () => confirmdata?.btn?.disagree ?? "No",
    [confirmdata?.btn?.disagree]
  );
  const question = useMemo(
    () => confirmdata?.question ?? "Are you sure?",
    [confirmdata?.question]
  );

  // Memoized loading state
  const isLoadingOrSaving = loading || saveformLoading;

  // Memoized button handler with error handling
  const handleAgree = useCallback(async () => {
    try {
      if (confirmdata?.onAgree) {
        setloading(true);
        const result = confirmdata.onAgree();
        if (result instanceof Promise) {
          await result;
        }
      }
    } catch (error) {
      console.error("Error in ConfirmModal onAgree:", error);
    } finally {
      setloading(false);
      props.onClose();
    }
  }, [confirmdata, props]);

  // Memoized close handler
  const handleDisagree = useCallback(() => {
    try {
      if (confirmdata?.onClose) {
        confirmdata.onClose();
      }
    } catch (error) {
      console.error("Error in ConfirmModal onClose:", error);
    } finally {
      props.onClose();
    }
  }, [confirmdata, props]);

  // Memoized footer render function
  const renderFooter = useCallback(
    () => (
      <ConfirmModalButtons
        isLoadingOrSaving={isLoadingOrSaving}
        agreeLabel={agreeLabel}
        disagreeLabel={disagreeLabel}
        onAgree={handleAgree}
        onDisagree={handleDisagree}
      />
    ),
    [isLoadingOrSaving, agreeLabel, disagreeLabel, handleAgree, handleDisagree]
  );

  return (
    <ModalWrapper
      size="sm"
      title="Confirmation"
      isOpen={props.open}
      onClose={props.onClose}
      footer={renderFooter}
    >
      <div className="w-full py-2">
        <p
          className="text-base sm:text-lg font-normal text-foreground/90 leading-relaxed"
          role="status"
          aria-live="polite"
        >
          {question}
        </p>
      </div>
    </ModalWrapper>
  );
});
