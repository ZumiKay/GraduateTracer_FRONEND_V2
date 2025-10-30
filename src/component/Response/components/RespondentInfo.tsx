import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Input } from "@heroui/react";
import { RespondentInfoType } from "../Response.type";

interface RespondentInfoProps {
  respondentInfo: RespondentInfoType;
  onRespondentInfoChange?: (info: RespondentInfoType) => void;
}

export const RespondentInfo: React.FC<RespondentInfoProps> = ({
  respondentInfo,
  onRespondentInfoChange,
}) => {
  const [localInfo, setlocalInfo] =
    useState<RespondentInfoType>(respondentInfo);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setlocalInfo(respondentInfo);
  }, [respondentInfo]);

  const handleNameChange = (value: string) => {
    const trimmedValue = value.trim();

    // Validate name
    if (!trimmedValue) {
      setNameError("Name is required");
    } else if (trimmedValue.length < 2) {
      setNameError("Name must be at least 2 characters");
    } else if (trimmedValue.length > 100) {
      setNameError("Name must not exceed 100 characters");
    } else {
      setNameError(null);
    }

    const updatedInfo = {
      ...localInfo,
      respondentName: value,
    };
    setlocalInfo(updatedInfo);
    onRespondentInfoChange?.(updatedInfo);
  };

  return (
    <Card className="mb-6 form-info-card">
      <CardHeader>
        <h2 className="text-xl font-semibold form-info-header">
          Your Information
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-600">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={localInfo?.respondentName || ""}
              onChange={(e) => handleNameChange(e.target.value)}
              isInvalid={!!nameError}
              errorMessage={nameError}
              classNames={{
                input: "text-foreground",
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-600">
              Email
            </label>
            <div className="px-3 py-2 bg-default-100 rounded-lg border border-default-200 text-foreground">
              {localInfo?.respondentEmail || "N/A"}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
