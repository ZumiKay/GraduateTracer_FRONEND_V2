import React from "react";
import { Card, CardBody } from "@heroui/react";
import { PlusIcon } from "../svg/GeneralIcon";

interface CreateCardBtnProps {
  onClick: () => void;
}

const CreateCardBtn: React.FC<CreateCardBtnProps> = ({ onClick }) => {
  return (
    <Card
      className="h-fit cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-dashed border-gray-300 hover:border-blue-400"
      isPressable
      onPress={onClick}
    >
      <CardBody className="flex flex-col items-center justify-center p-8 min-h-[200px]">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
          <PlusIcon width="24" height="24" className="text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Create New Form
        </h3>
        <p className="text-sm text-gray-500 text-center">
          Click here to create a new form
        </p>
      </CardBody>
    </Card>
  );
};

export default CreateCardBtn;
