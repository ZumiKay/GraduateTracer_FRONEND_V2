import { Image } from "@nextui-org/react";
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
  return (
    <div
      onClick={() => onClick && onClick()}
      className={`w-[300px] h-[200px] rounded-md 
     ${type === FormTypeEnum.Quiz ? "bg-secondary" : "bg-success"}
     flex flex-col justify-start items-center gap-y-5 pl-2 relative text-white hover:bg-white hover:text-black transition-colors cursor-default
     `}
    >
      {type === FormTypeEnum.Quiz && (
        <span className="absolute bottom-1 left-1 text-sm font-medium">
          Quiz
        </span>
      )}
      <div className="w-full h-fit flex flex-row items-center">
        <p className="text-lg font-bold w-full h-fit text-left">
          {data?.title}
        </p>
        {isManage && (
          <span
            className={`w-[25px] h-[22px] rounded-[100%] ${
              isSelect ? "bg-success-300" : "bg-white"
            } mr-2`}
          ></span>
        )}
      </div>
      <table className="carddetail w-full h-fit" align="left">
        <tbody
          className={`text-left ${
            FormTypeEnum.Quiz ? "text-black" : "text-white"
          }`}
        >
          <tr>
            <th>Response</th>
            <td>{data.responses?.length ?? 0}</td>
          </tr>
          <tr>
            <th>CreatedAt</th>
            <td>{`${data.createdAt}`}</td>
          </tr>
          <tr>
            <th>Modified:</th>
            <td>{`${data.updatedAt}`}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Card;

export const CreateCardBtn = (
  props: React.AllHTMLAttributes<HTMLDivElement>
) => {
  return (
    <div
      className="w-[300px] h-[200px] cursor-default 
      grid place-content-center place-items-center
      border-3 border-black 
      rounded-md hover:border-secondary
    "
      {...props}
    >
      <Image alt="plus-sign" src={PlusSign} className="w-[30px] h-[30px]" />
      <p className="text-xl italic font-bold">New Form</p>
    </div>
  );
};
