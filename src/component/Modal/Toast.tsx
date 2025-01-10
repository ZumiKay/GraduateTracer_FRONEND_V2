import { Button } from "@nextui-org/react";
import { CSSProperties } from "react";
import { toast, ToastContentProps } from "react-toastify";

type ToastContenttype = {
  title: string;
  content: string;
  btn?: {
    content: string;
    color: CSSProperties;
    onClick?: () => void;
  };
};

type CustomNotificationProps = ToastContentProps<{
  title: string;
  content: string;
  btn?: {
    content: string;
    color: CSSProperties;
    onClick?: () => void;
  };
}>;
const CustomNofication = ({ data }: CustomNotificationProps) => {
  return (
    <div className="flex flex-col w-full">
      <h3 className={`text-white font-bold`}>{data.title}</h3>
      <div className="flex items-center justify-between">
        <p className="text-sm">{data.content}</p>
        {data.btn && (
          <Button
            style={data.btn.color}
            onPress={() => data.btn?.onClick && data.btn.onClick()}
            className="max-w-sm font-bold"
            variant="bordered"
          >
            {data.content}
          </Button>
        )}
      </div>
    </div>
  );
};

export default function SuccessToast(data: ToastContenttype) {
  return toast.success(CustomNofication, {
    data: data,
    autoClose: 22,
    ariaLabel: "success toast",
  });
}

export function ErrorToast(data: ToastContenttype) {
  return toast.error(CustomNofication, {
    data: data,
    autoClose: false,
    closeButton: true,
  });
}
export function InfoToast(data: ToastContenttype) {
  return toast.info(CustomNofication, {data: data , autoClose: 2000 , closeButton: true})
}

