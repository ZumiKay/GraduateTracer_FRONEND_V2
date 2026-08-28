import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import RespondentForm, {
  RespondentFormProps,
} from "../../Response/RespondentForm";
import useRespondentFormPaginaition from "../../Response/hooks/usePaginatedFormData";
import { RespondentInfoType } from "../../Response/Response.type";
import { EyeIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/react";

interface PreviewTabProps {
  formId: string;
}

const PreviewTab: React.FC<PreviewTabProps> = ({ formId }) => {
  const user = useSelector((root: RootState) => root.usersession);

  const formReqData = useRespondentFormPaginaition({
    formId,
    accessMode: "authenticated",
    enabled: Boolean(formId),
    isPreview: true,
  });

  const respondentFormProps: RespondentFormProps = useMemo(
    () => ({
      data: formReqData,
      userId: user.user?._id,
      formSessionInfo: {
        respondentEmail: user.user?.email || "preview_mode@local",
        respondentName: user.user?.name || "Form Owner",
        isGuest: false,
      } as RespondentInfoType,
      accessMode: "authenticated",
      isUserActive: true,
      isLoading: formReqData.isFetching,
      isPreview: true,
    }),
    [formReqData, user.user?._id, user.user?.email, user.user?.name],
  );

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="w-full max-w-4xl mt-4 mb-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <EyeIcon className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            Preview Mode — This is how respondents will see your form.
          </span>
        </div>
        <Chip size="sm" color="primary" variant="flat">
          Preview
        </Chip>
      </div>

      <div className="w-full">
        <RespondentForm {...respondentFormProps} />
      </div>
    </div>
  );
};

export default PreviewTab;
