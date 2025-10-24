import ApiRequest from "../../../hooks/ApiHook";
import { ContentType } from "../../../types/Form.types";

export const AsyncAutoSaveDeleteRequest = async ({
  formId,
  qId,
}: {
  formId: string;
  qId: string;
}) => {
  const request = await ApiRequest({
    url: "/deletecontent",
    method: "DELETE",
    cookie: true,
    refreshtoken: true,
    data: {
      id: qId,
      formId,
    },
  });

  if (!request.success) {
    throw new Error(request.error ?? "Error Occured");
  }

  return true;
};

/**
 * Optimized function to delete a question and shift indices
 * Removes the target question and updates all indices in a single pass
 * @params targetQ Num , targetQIdx Num, allQ: ContentTypes[]
 * @returns ContentType[]
 */
export const DeleteAndShift = ({
  targetQuestion,
  targetQuestionIdx,
  allquestion,
}: {
  targetQuestion: number;

  targetQuestionIdx: number;
  allquestion: Array<ContentType>;
}): Array<ContentType> => {
  const result: Array<ContentType> = [];

  for (const question of allquestion) {
    // Skip the deleted question
    if (question.qIdx === targetQuestion) {
      continue;
    }

    // Determine if updates are needed
    const needsQIdxShift = question.qIdx > targetQuestion;

    // Check if conditional needs filtering or updating
    const hasConditionalToFilter = question.conditional?.some(
      (c) => c.contentIdx === targetQuestionIdx
    );
    const hasConditionalToUpdate = question.conditional?.some(
      (c) => c.contentIdx && c.contentIdx > targetQuestionIdx
    );
    const hasConditionalUpdate =
      hasConditionalToFilter || hasConditionalToUpdate;

    const hasParentUpdate =
      question.parentcontent?.qIdx &&
      question.parentcontent.qIdx > targetQuestion;

    // If no updates needed, keep question as-is
    if (!needsQIdxShift && !hasConditionalUpdate && !hasParentUpdate) {
      result.push(question);
      continue;
    }

    // Process conditional updates
    let updatedConditional = question.conditional;
    if (hasConditionalUpdate && question.conditional) {
      // Filter out conditions referencing the deleted question
      updatedConditional = question.conditional.filter(
        (cond) => cond.contentIdx !== targetQuestionIdx
      );

      // Update indices for remaining conditions
      if (hasConditionalToUpdate) {
        updatedConditional = updatedConditional.map((qCond) => ({
          ...qCond,
          contentIdx:
            qCond.contentIdx && qCond.contentIdx > targetQuestionIdx
              ? qCond.contentIdx - 1
              : qCond.contentIdx,
        }));
      }
    }

    const updatedQuestion: ContentType = {
      ...question,
      qIdx: needsQIdxShift ? question.qIdx - 1 : question.qIdx,
      parentcontent: hasParentUpdate
        ? {
            ...question.parentcontent!,
            qIdx: question.parentcontent!.qIdx! - 1,
          }
        : question.parentcontent,
      conditional: updatedConditional,
    };

    result.push(updatedQuestion);
  }

  return result;
};
