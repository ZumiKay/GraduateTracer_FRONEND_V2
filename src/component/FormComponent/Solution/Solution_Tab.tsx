import { DefaultContentType } from "../../../types/Form.types";
import Respondant_Question_Card from "../../Card/Respondant.card";

const Solution_Tab = () => {
  return (
    <div className="solution_tab w-full h-fit flex flex-col items-center">
      <div className="question_card w-full h-fit flex flex-col items-center gap-20">
        <Respondant_Question_Card content={DefaultContentType} bg="lightgray" />
        <Respondant_Question_Card content={DefaultContentType} bg="lightgray" />
      </div>
    </div>
  );
};

export default Solution_Tab;
