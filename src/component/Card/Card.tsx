import { Image } from "@nextui-org/react";
import PlusSign from "../../assets/plus 2.png";
import React from "react";

interface CardPropsType {
  type: "quiz" | "normal";
  isManage?: boolean;
  onClick?: () => void;
  isSelect?: boolean;
}
const Card = ({ type, isManage, onClick, isSelect }: CardPropsType) => {
  return (
    <div
      onClick={() => onClick && onClick()}
      className={`w-[300px] h-[200px] rounded-md 
     ${type === "quiz" ? "bg-secondary" : "bg-success"}
     flex flex-col justify-start items-center gap-y-5 pl-2 relative hover:bg-white transition-colors cursor-default
     `}
    >
      {type === "quiz" && (
        <span className="absolute bottom-1 left-1 text-sm font-medium">
          Quiz
        </span>
      )}
      <div className="w-full h-fit flex flex-row items-center">
        <p className="text-lg font-bold w-full h-fit text-left">Form Title</p>
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
            type === "quiz" ? "text-black" : "text-white"
          }`}
        >
          <tr>
            <th>Response</th>
            <td>20</td>
          </tr>
          <tr>
            <th>CreatedAt</th>
            <td>25/12/2024</td>
          </tr>
          <tr>
            <th>Modified:</th>
            <td>25/12/2024</td>
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
