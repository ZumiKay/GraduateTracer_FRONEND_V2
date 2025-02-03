import { Button } from "@nextui-org/react";
import { CSSProperties, useState } from "react";
import { toast, ToastContentProps } from "react-toastify";
import ModalWrapper from "./Modal";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

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

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
};
export function ConfirmModal(props: ConfirmModalProps) {
  const confirmdata = useSelector(
    (root: RootState) => root.openmodal.confirm.data
  );
  const [loading, setloading] = useState(false);
  const Btn = () => {
    return (
      <div className="btn_container inline-flex w-fit gap-x-3 items-center">
        <Button
          color="success"
          onPress={async () => {
            if (confirmdata?.onAgree) {
              setloading(true);
              await confirmdata.onAgree();
              setloading(false);
            }
            props.onClose();
          }}
          className="max-w-xs font-bold"
          isLoading={loading}
          variant="flat"
        >
          Yes
        </Button>
        <Button
          color="danger"
          onPress={() => {
            if (confirmdata?.onClose) confirmdata.onClose();
            props.onClose();
          }}
          className="max-w-xs font-bold"
          variant="flat"
        >
          No
        </Button>
      </div>
    );
  };
  return (
    <ModalWrapper
      size="sm"
      title="Confirmation"
      isOpen={props.open}
      onClose={props.onClose}
      footer={() => <Btn />}
    >
      <div className="bg-white w-full h-full">
        <p
          className="text-lg font-normal
        "
        >
          {confirmdata?.question ?? "Are you sure ?"}
        </p>
      </div>
    </ModalWrapper>
  );
}
