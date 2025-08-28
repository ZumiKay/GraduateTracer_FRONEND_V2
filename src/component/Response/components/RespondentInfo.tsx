import React from "react";
import { Card, CardHeader, CardBody, Input } from "@heroui/react";
import { RespondentInfoType } from "../Response.type";

interface RespondentInfoProps {
  respondentInfo: RespondentInfoType;
  setRespondentInfo: React.Dispatch<React.SetStateAction<RespondentInfoType>>;
  isGuestMode: boolean;
}

export const RespondentInfo: React.FC<RespondentInfoProps> = ({
  respondentInfo,
  setRespondentInfo,
  isGuestMode,
}) => {
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
            value={respondentInfo?.name}
            onChange={(e) =>
              setRespondentInfo((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            isDisabled={isGuestMode}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={respondentInfo.email}
            onChange={(e) =>
              setRespondentInfo((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            isDisabled={isGuestMode}
            readOnly={true}
          />
        </div>
      </CardBody>
    </Card>
  );
};
