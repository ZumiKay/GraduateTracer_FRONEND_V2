import { useDispatch, useSelector } from "react-redux";
import Respondant_Question_Card from "../../Card/Respondant.card";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import { CircularProgress } from "@heroui/react";
import { setallquestion, setdisbounceQuestion } from "../../../redux/formstore";
import { ContentType } from "../../../types/Form.types";
import { useEffect, useState } from "react";
import ApiRequest from "../../../hooks/ApiHook";

const Solution_Tab = () => {
  const { allquestion, fetchloading, formstate } = useSelector(
    (root: RootState) => root.allform
  );

  const [totalsummerize, settotalsummerize] = useState({
    totalpage: 0,
    totalquestion: 0,
    totalscore: 0,
  });
  const [loading, setloading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const gettotalitem = async () => {
      setloading(true);
      const getreq = await ApiRequest({
        url: "/filteredform?ty=total&q=" + formstate._id,
        method: "GET",
        cookie: true,
        refreshtoken: true,
      });
      setloading(false);

      if (!getreq.success || !getreq.data) return;

      settotalsummerize(getreq.data as never);
    };

    if (formstate._id) gettotalitem();
  }, [formstate._id]);

  //Helper Function
  const updateQuestion = (newVal: Partial<ContentType>, qIdx: number) => {
    const updatedQuestions = allquestion.map((question) => {
      if (qIdx === question.idx) {
        const updatedQuestion = { ...question, ...newVal };

        if (formstate.setting?.autosave) {
          dispatch(setdisbounceQuestion(updatedQuestion)); // Avoid multiple dispatches
        }

        return updatedQuestion;
      }

      return question;
    });

    dispatch(setallquestion(updatedQuestions as Array<ContentType>));
  };
  ///

  return (
    <div className="solution_tab w-full h-fit flex flex-col items-center pt-20 pb-20">
      <div className="question_card w-full h-fit flex flex-col items-center gap-20">
        <div className="w-[200px] h-[100px] text-md font-medium bg-white p-2 self-start text-left rounded-lg grid place-content-center">
          {loading ? (
            <CircularProgress />
          ) : (
            <>
              <p hidden={formstate.type !== "QUIZ"}>
                Total Score: {totalsummerize.totalscore}
              </p>
              <p>Total Questions: {totalsummerize.totalquestion}</p>
              <p>Total Page: {totalsummerize.totalpage}</p>
            </>
          )}
        </div>
        {fetchloading ? (
          <QuestionLoading count={3} />
        ) : (
          allquestion.map((question, idx) => (
            <Respondant_Question_Card
              idx={idx}
              key={`RespondandCard ${question.idx}`}
              content={question}
              onSelectAnswer={({ answer }) => {
                updateQuestion({ answer: { answer } }, idx);
              }}
              color={formstate.setting?.qcolor}
              onChangeScore={(val) => updateQuestion({ score: val }, idx)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Solution_Tab;
