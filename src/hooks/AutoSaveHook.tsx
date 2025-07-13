import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ContentType } from "../types/Form.types";
import { AutoSaveQuestion } from "../pages/FormPage.action";
import { ErrorToast } from "../component/Modal/AlertModal";

const AutoSaveForm = () => {
  const { allquestion, formstate, page, debounceQuestion } = useSelector(
    (root: RootState) => root.allform
  );

  const [toUpdateQuestion, settoUpdateQuestion] = useState<ContentType | null>(
    null
  );
  const [loading, setloading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      settoUpdateQuestion(debounceQuestion);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [debounceQuestion]);

  useEffect(() => {
    const AsyncSaveForm = async () => {
      if (formstate._id) {
        setloading(true);
        const request = await AutoSaveQuestion({
          data: allquestion.map((question) => ({
            ...question,
            conditional: question.conditional?.map((cond) => ({
              ...cond,
              contentIdx: undefined,
            })),
          })),
          page,
          formId: formstate._id,
          type: "save",
        });

        setloading(false);
        if (!request.success) {
          ErrorToast({
            title: "Failed",
            content: "Can't Save",
            toastid: "autosave",
          });
          return;
        }
      }
    };

    if (formstate.setting?.autosave && debounceQuestion) AsyncSaveForm();
  }, [toUpdateQuestion]);

  return (
    <div className="Saveindcator w-[150px] h-full text-md font-normal">
      {loading ? <p className="animate-pulse">Saving...</p> : "Saved"}
    </div>
  );
};

export default AutoSaveForm;
