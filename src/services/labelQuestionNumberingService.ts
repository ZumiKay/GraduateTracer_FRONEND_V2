import { ContentType } from "../types/Form.types";

/**
 * Get a unique identifier for a question
 */
const getQuestionIdentifier = (
  question: ContentType,
  arrayIndex: number
): string => {
  if (question._id) return question._id.toString();
  return `temp_${question.qIdx ?? arrayIndex}`;
};

/**
 * Get the parent qIdx from parentcontent
 */
const getParentIdentifier = (question: ContentType): string | null => {
  if (!question.parentcontent) return null;

  // If qId exists (reference to parent's _id), use it
  if (question.parentcontent.qId) {
    return question.parentcontent.qId;
  }

  // For unsaved data, use qIdx-based identifier
  if (question.parentcontent.qIdx !== undefined) {
    return `temp_${question.parentcontent.qIdx}`;
  }

  return null;
};

export const AddQuestionNumbering = ({
  questions,
  lastIdx,
}: {
  questions: Array<ContentType>;
  lastIdx?: number;
}): Array<ContentType> => {
  if (!questions || questions.length === 0) {
    return [];
  }

  const questionIdMap = new Map<string, string>();

  //Assign question unqiue identifier
  const questionIndexMap = new Map<string, number>();
  questions.forEach((q, idx) => {
    const id = getQuestionIdentifier(q, idx);
    questionIndexMap.set(id, idx);
  });

  const parentChildrenMap = new Map<
    string,
    Array<{ question: ContentType; index: number; id: string }>
  >();

  questions.forEach((question, index) => {
    const parentId = getParentIdentifier(question);
    if (parentId) {
      if (!parentChildrenMap.has(parentId)) {
        parentChildrenMap.set(parentId, []);
      }
      parentChildrenMap.get(parentId)!.push({
        question,
        index,
        id: getQuestionIdentifier(question, index),
      });
    }
  });

  // Sort sibling groups once upfront by qIdx
  parentChildrenMap.forEach((siblings) => {
    siblings.sort((a, b) => {
      const qIdxDiff = (a.question.qIdx || 0) - (b.question.qIdx || 0);
      return qIdxDiff !== 0 ? qIdxDiff : a.index - b.index;
    });
  });

  // Helper function to find a question's index in the array by its identifier
  const findQuestionByIdentifier = (
    targetId: string
  ): { question: ContentType; index: number } | null => {
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const id = getQuestionIdentifier(q, idx);
      if (id === targetId) {
        return { question: q, index: idx };
      }
    }
    return null;
  };

  // Check if a question is a top-level question (has no parent or parent is not conditional)
  const isTopLevelQuestion = (question: ContentType): boolean => {
    return (
      !question.parentcontent ||
      (question.parentcontent.qIdx === undefined && !question.parentcontent.qId)
    );
  };

  // Helper function to build hierarchical number with recursion for nested conditionals
  const buildQuestionNumber = (
    question: ContentType,
    arrayIndex: number,
    visited: Set<string> = new Set()
  ): string => {
    const questionId = getQuestionIdentifier(question, arrayIndex);

    // Prevent infinite loops
    if (visited.has(questionId)) {
      return `${arrayIndex + 1}`;
    }
    visited.add(questionId);

    const parentId = getParentIdentifier(question);

    // QuestionId for non-conditional question (top-level)
    if (!parentId || isTopLevelQuestion(question)) {
      // Count how many top-level questions come before this one (inclusive)
      let topLevelCount = 0;
      for (let i = 0; i <= arrayIndex; i++) {
        if (isTopLevelQuestion(questions[i])) {
          topLevelCount++;
        }
      }
      // Add lastIdx to account for questions from previous pages
      const offset = lastIdx ?? 0;
      return `${topLevelCount + offset}`;
    }

    // Find parent question number from our map
    let parentNumber = questionIdMap.get(parentId);

    // If parent number not in map yet, find the parent and recursively build its number
    if (!parentNumber) {
      const parentResult = findQuestionByIdentifier(parentId);

      if (parentResult) {
        const { question: parentQuestion, index: parentIndex } = parentResult;

        // Recursively build parent's number
        parentNumber = buildQuestionNumber(
          parentQuestion,
          parentIndex,
          visited
        );

        // Cache it for future lookups
        questionIdMap.set(parentId, parentNumber);
      } else {
        // Fallback if parent not found
        parentNumber = `${arrayIndex + 1}`;
      }
    }

    // Find position among siblings (children of the same parent)
    const siblings = parentChildrenMap.get(parentId);
    let position = 1;

    if (siblings) {
      const currentId = getQuestionIdentifier(question, arrayIndex);
      for (const sibling of siblings) {
        if (sibling.id === currentId) {
          break;
        }
        position++;
      }
    }

    return `${parentNumber}.${position}`;
  };

  // Process questions and assign questionId - preserves array order
  const result = questions.map((question, index) => {
    const questionId = buildQuestionNumber(question, index);

    // Store in map for reference by child questions
    const id = getQuestionIdentifier(question, index);
    questionIdMap.set(id, questionId);

    // Update parentcontent with parent's questionId if it exists
    let updatedParentContent = question.parentcontent;
    const parentId = getParentIdentifier(question);

    if (parentId && question.parentcontent) {
      const parentQuestionId = questionIdMap.get(parentId);
      updatedParentContent = {
        ...question.parentcontent,
        questionId: parentQuestionId || undefined,
      };
    }

    return {
      ...question,
      questionId,
      parentcontent: updatedParentContent,
    };
  });

  return result;
};

/**
 * Strips questionId and parentcontent.questionId before saving to database
 * These are display-only fields that should not be persisted
 */
export const stripQuestionNumbering = (
  questions: Array<ContentType>
): Array<ContentType> => {
  if (!questions || questions.length === 0) {
    return [];
  }

  return questions.map((question) => {
    // Create a copy without questionId
    const cleanedQuestion = { ...question };
    delete cleanedQuestion.questionId;

    // If parentcontent exists, remove questionId from it
    if (cleanedQuestion.parentcontent) {
      cleanedQuestion.parentcontent = { ...cleanedQuestion.parentcontent };
      delete cleanedQuestion.parentcontent.questionId;
    }

    return cleanedQuestion;
  });
};
