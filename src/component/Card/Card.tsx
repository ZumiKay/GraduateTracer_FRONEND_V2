import { Image } from "@heroui/react";
import PlusSign from "../../assets/plus 2.png";
import React from "react";
import { FormDataType, FormTypeEnum } from "../../types/Form.types";

interface CardPropsType {
  type: FormTypeEnum;
  isManage?: boolean;
  onClick?: () => void;
  isSelect?: boolean;
  data: Partial<FormDataType>;
}
const Card = ({ type, isManage, onClick, isSelect, data }: CardPropsType) => {
  const isQuiz = type === FormTypeEnum.Quiz;
  const isAcceptingResponses = data.setting?.acceptResponses !== false;

  return (
    <div
      onClick={() => onClick && onClick()}
      className={`w-full max-w-[320px] h-[240px] rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer relative overflow-hidden
        ${
          isQuiz
            ? "bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
            : "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800"
        }
        ${isSelect ? "ring-4 ring-blue-400 ring-opacity-60" : ""}
        ${!isAcceptingResponses ? "opacity-75" : ""}
      `}
    >
      {/* Status indicators */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        {isQuiz && (
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
            Quiz
          </span>
        )}
        {!isAcceptingResponses && (
          <span className="bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
            Closed
          </span>
        )}
      </div>

      {/* Selection indicator */}
      {isManage && (
        <div className="absolute top-3 right-3">
          <div
            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center
            ${isSelect ? "bg-blue-500" : "bg-transparent"}
          `}
          >
            {isSelect && (
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 h-full flex flex-col justify-between text-white">
        <div>
          <h3 className="text-lg font-bold mb-3 line-clamp-2 leading-tight">
            {data?.title || "Untitled Form"}
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Responses:</span>
              <span className="font-semibold bg-white/20 px-2 py-1 rounded-full">
                {data.responses?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Status:</span>
              <span
                className={`font-semibold px-2 py-1 rounded-full text-xs ${
                  isAcceptingResponses
                    ? "bg-green-500/80 text-white"
                    : "bg-red-500/80 text-white"
                }`}
              >
                {isAcceptingResponses ? "Active" : "Closed"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex justify-between items-center text-xs text-white/70">
            <span>
              Created: {new Date(data.createdAt || "").toLocaleDateString()}
            </span>
            <span>
              Updated: {new Date(data.updatedAt || "").toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default Card;

export const CreateCardBtn = (
  props: React.AllHTMLAttributes<HTMLDivElement>
) => {
  return (
    <div
      className="w-full max-w-[320px] h-[240px] cursor-pointer 
      flex flex-col items-center justify-center gap-4
      border-3 border-dashed border-gray-300 hover:border-blue-400
      rounded-xl hover:bg-blue-50 transition-all duration-300
      bg-white shadow-md hover:shadow-lg
      group
    "
      {...props}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Image
          alt="plus-sign"
          src={PlusSign}
          className="w-8 h-8 filter brightness-0 invert"
        />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
          New Form
        </p>
        <p className="text-sm text-gray-500 mt-1">Click to create a new form</p>
      </div>
    </div>
  );
};
