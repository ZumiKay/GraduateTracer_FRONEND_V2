import React, { useCallback } from "react";
import { Card, CardHeader, CardBody, Input } from "@heroui/react";
import { RespondentInfoType } from "../Response.type";
import {
  generateStorageKey,
  saveFormStateToLocalStorage,
} from "../../../helperFunc";

interface RespondentInfoProps {
  formId: string;
  respondentInfo: RespondentInfoType;
  setRespondentInfo: (
    value: React.SetStateAction<RespondentInfoType | undefined>
  ) => void;
}

export const RespondentInfo: React.FC<RespondentInfoProps> = ({
  respondentInfo,
  formId,
  setRespondentInfo,
}) => {
  const handleUpdateFormUser = useCallback(() => {
    saveFormStateToLocalStorage({
      key: generateStorageKey({
        suffix: "state",
        formId: formId,
        userKey: respondentInfo.respondentEmail,
      }),
      data: {
        respondentInfo: {
          ...respondentInfo,
        },
      },
    });
  }, [formId, respondentInfo]);
  return (
    <Card className="mb-6 form-info-card">
      <CardHeader>
        <h2 className="text-xl font-semibold form-info-header">
          Your Information
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            placeholder="Enter your name"
            value={respondentInfo?.respondentName}
            onChange={(e) =>
              setRespondentInfo({ respondentName: e.target.value } as never)
            }
            onBlur={() => handleUpdateFormUser()}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={respondentInfo.respondentEmail}
            onChange={(e) =>
              setRespondentInfo({ respondentEmail: e.target.value })
            }
            readOnly={true}
          />
        </div>
      </CardBody>
    </Card>
  );
};
