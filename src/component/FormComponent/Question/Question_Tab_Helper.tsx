import ApiRequest from "../../../hooks/APIHook/ApiHook";
import { AddQuestionNumbering } from "../../../services/labelQuestionNumberingService";
import { ContentType } from "../../../types/Form.types";

/**
 * Auto Save Helper Func
 * Delete Question
 * @requires AUTOSAVE ENABLED
 */
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

export const DeleteAndShift = ({
  targetQuestion,
  targetQuestionIdx,
  allquestion,
  lastIdx,
}: {
  targetQuestion: number;
  targetQuestionIdx: number;
  allquestion: Array<ContentType>;
  lastIdx?: number;
}): Array<ContentType> => {
  const questionsToDelete = new Set<number>();

  questionsToDelete.add(targetQuestion);

  // Find all child questions recursively
  const findChildQuestions = (parentQIdx: number) => {
    for (const question of allquestion) {
      if (question.parentcontent?.qIdx === parentQIdx) {
        questionsToDelete.add(question.qIdx);
        findChildQuestions(question.qIdx);
      }
    }
  };

  findChildQuestions(targetQuestion);

  const deletedQIdxList = Array.from(questionsToDelete).sort((a, b) => a - b);

  const result: Array<ContentType> = [];

  for (const question of allquestion) {
    // Skip all questions to be delete
    if (questionsToDelete.has(question.qIdx)) {
      continue;
    }

    const deletedBeforeCount = deletedQIdxList.filter(
      (deletedQIdx) => deletedQIdx < question.qIdx,
    ).length;

    // Verify conditional
    const hasConditionalToFilter = question.conditional?.some((c) =>
      deletedQIdxList.includes(c.contentIdx as number),
    );
    const hasConditionalToUpdate = question.conditional?.some(
      (c) => c.contentIdx && c.contentIdx > targetQuestionIdx,
    );
    const hasConditionalUpdate =
      hasConditionalToFilter || hasConditionalToUpdate;

    const hasParentUpdate =
      question.parentcontent?.qIdx !== undefined &&
      deletedQIdxList.some(
        (deletedQIdx) => question.parentcontent!.qIdx! > deletedQIdx,
      );

    if (deletedBeforeCount === 0 && !hasConditionalUpdate && !hasParentUpdate) {
      result.push(question);
      continue;
    }

    // Process conditional updates
    let updatedConditional = question.conditional;
    if (hasConditionalUpdate && question.conditional) {
      // Filter out conditions for any deleted question
      updatedConditional = question.conditional.filter(
        (cond) => !deletedQIdxList.includes(cond.contentIdx as number),
      );

      // Update indices
      if (hasConditionalToUpdate) {
        updatedConditional = updatedConditional.map((qCond) => {
          if (!qCond.contentIdx) return qCond;

          // Count how many deleted questions are before this conditional's contentIdx
          const deletedBeforeConditional = deletedQIdxList.filter(
            (deletedQIdx) => deletedQIdx < qCond.contentIdx!,
          ).length;

          return {
            ...qCond,
            contentIdx: qCond.contentIdx - deletedBeforeConditional,
          };
        });
      }
    }

    // Calculate parent index shift
    let updatedParentContent = question.parentcontent;
    if (question.parentcontent?.qIdx !== undefined) {
      const deletedBeforeParent = deletedQIdxList.filter(
        (deletedQIdx) => deletedQIdx < question.parentcontent!.qIdx!,
      ).length;

      if (deletedBeforeParent > 0) {
        updatedParentContent = {
          ...question.parentcontent,
          qIdx: question.parentcontent.qIdx - deletedBeforeParent,
        };
      }
    }

    const updatedQuestion: ContentType = {
      ...question,
      qIdx: question.qIdx - deletedBeforeCount,
      parentcontent: updatedParentContent,
      conditional: updatedConditional,
    };

    result.push(updatedQuestion);
  }

  return AddQuestionNumbering({ questions: result, lastIdx });
};
