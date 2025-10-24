import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { RespondentInfoType } from "../Response.type";

interface RespondentInfoProps {
  respondentInfo: RespondentInfoType;
}

export const RespondentInfo: React.FC<RespondentInfoProps> = ({
  respondentInfo,
}) => {
  const [localInfo, setlocalInfo] =
    useState<RespondentInfoType>(respondentInfo);

  useEffect(() => {
    setlocalInfo(respondentInfo);
  }, [respondentInfo]);

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
              Name
            </label>
            <div className="px-3 py-2 bg-default-100 rounded-lg border border-default-200 text-foreground">
              {localInfo?.respondentName || "N/A"}
            </div>
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
