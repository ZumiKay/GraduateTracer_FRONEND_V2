import React from "react";
import { Card, CardHeader, Progress } from "@heroui/react";

interface FormHeaderProps {
  title: string;
  currentPage: number;
  totalPages: number;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  currentPage,
  totalPages,
}) => {
  const progress = (currentPage / totalPages) * 100;

  return (
    <Card className="mb-4 sm:mb-6 bg-white">
      <CardHeader>
        <div className="w-full bg-white">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-black break-words">{title}</h1>
          <Progress
            value={progress}
            className="mb-4"
            aria-label="Progress"
            color="primary"
            size="sm"
          />
          <p className="text-sm text-black">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
};
