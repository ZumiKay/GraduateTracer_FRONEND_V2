import { Input } from "@nextui-org/react";
import { ContentType } from "../../types/Form.types";
import Tiptap from "../FormComponent/TipTabEditor";

interface TextCardProps {
  content: ContentType;
  bg: string;
}

const Respondant_Question_Card = ({ content, bg }: TextCardProps) => {
  return (
    <div
      className="repsondant_response_card w-card_respondant_width h-card_respondant_height
       text-black rounded-lg flex flex-col gap-y-5 p-5 border-[20px] border-blue-300 bg-white
        relative
       "
    >
      <div className="tiptab_container w-full h-fit">
        <Tiptap value={content.title as never} readonly />
      </div>
      <div className="answer_container w-full h-full bg-white rounded-md"></div>

      <div className="score_container w-[150px] h-[30px] absolute bottom-[-11%] right-[-1%]">
        <Input
          size="md"
          radius={"none"}
          className="w-full h-full"
          placeholder="Enter Score"
          endContent={"/10"}
        />
      </div>
    </div>
  );
};

export default Respondant_Question_Card;
