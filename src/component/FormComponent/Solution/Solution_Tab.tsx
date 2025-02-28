import { useDispatch, useSelector } from "react-redux";
import Respondant_Question_Card from "../../Card/Respondant.card";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import { Pagination } from "@heroui/react";
import { useSearchParams } from "react-router";
import {
  setallquestion,
  setpage,
  setreloaddata,
} from "../../../redux/formstore";

const Solution_Tab = () => {
  const { allquestion, fetchloading, page, formstate } = useSelector(
    (root: RootState) => root.allform
  );
  const [searchparam, setsearchparam] = useSearchParams();
  const dispatch = useDispatch();

  const handlePageChange = (page: number) => {
    setsearchparam({ ...searchparam, page: page.toString() });
    dispatch(setpage(page));
    dispatch(setreloaddata(true));
  };

  function handleSetAnswer<t>(questionidx: number, answer: t) {
    dispatch(
      setallquestion((prev) => {
        return prev.map((question) => {
          if (question.idx === questionidx) {
            return { ...question, answer: answer as never };
          }
          return question;
        });
      })
    );
  }

  return (
    <div className="solution_tab w-full h-fit flex flex-col items-center pt-20 pb-20">
      <div className="question_card w-full h-fit flex flex-col items-center gap-20">
        <div className="w-full h-fit text-lg text-center font-bold">
          <p>Total Score: 20</p>
          <p>Total Questions: 20</p>
        </div>
        {fetchloading ? (
          <QuestionLoading count={3} />
        ) : (
          allquestion.map((question, qIdx) => (
            <Respondant_Question_Card
              key={`RespondandCard ${qIdx}`}
              content={question}
              onSelectAnswer={({ answer }) => {
                handleSetAnswer(question.idx, answer);
              }}
              color={formstate.setting?.qcolor}
            />
          ))
        )}
      </div>

      {formstate.totalpage > 1 && (
        <Pagination
          loop
          showControls
          color="primary"
          initialPage={1}
          total={formstate.totalpage ?? 0}
          page={page}
          onChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default Solution_Tab;
