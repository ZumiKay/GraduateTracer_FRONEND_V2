import { ContentType } from "../types/Form.types";

/**
 * Check for unsaved questions in admin form builder (Question Tab)
 * This checks for structural changes to the form, not required field validation
 * @params allquestion , prevAllQuestion , currentPage
 * @returns boolean
 */
export const checkUnsavedQuestions = (
  allQuestion: ContentType[],
  prevAllQuestion: ContentType[],
  currentPage: number
): boolean => {
  // Filter questions for current page
  const currentPageQuestions = allQuestion.filter(
    (q) => q.page === currentPage
  );
  const prevPageQuestions = prevAllQuestion.filter(
    (q) => q.page === currentPage
  );

  // If different number of questions, there are changes
  if (currentPageQuestions.length !== prevPageQuestions.length) {
    return true;
  }

  // Check each question for structural changes (excluding required field validation)
  return currentPageQuestions.some((currentQ, index) => {
    const prevQ = prevPageQuestions[index];

    if (!prevQ) {
      return true;
    }

    return (
      currentPageQuestions.some((i) => !i._id) ||
      JSON.stringify(currentQ.title) !== JSON.stringify(prevQ.title) ||
      currentQ.type !== prevQ.type ||
      currentQ.require !== prevQ.require ||
      currentQ.score !== prevQ.score ||
      JSON.stringify(currentQ.conditional) !==
        JSON.stringify(prevQ.conditional) ||
      JSON.stringify(currentQ[currentQ.type]) !==
        JSON.stringify(prevQ[prevQ.type]) ||
      JSON.stringify(currentQ.parentcontent) !==
        JSON.stringify(prevQ.parentcontent)
    );
  });
};

/**
 * Check for required field validation in respondent forms
 * This only checks if required questions have been answered
 */
export const checkRequiredFieldsValidation = (
  questions: ContentType[],
  userResponses: Record<string, string | string[] | number | boolean>,
  currentPage: number
): { isValid: boolean; missingFields: string[] } => {
  const currentPageQuestions = questions.filter(
    (q) => q.page === currentPage && q.require
  );

  const missingFields: string[] = [];

  currentPageQuestions.forEach((question) => {
    const questionId = question._id || question.title?.toString() || "";
    const userResponse = userResponses[questionId];

    // Check if required question is answered
    if (
      !userResponse ||
      (Array.isArray(userResponse) && userResponse.length === 0) ||
      (typeof userResponse === "string" && userResponse.trim() === "")
    ) {
      missingFields.push(
        question.title?.toString() || `Question ${questionId}`
      );
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Get count of unsaved questions on a specific page
 * @param allQuestion - Array of current questions
 * @param prevAllQuestion - Array of previously saved questions
 * @param currentPage - Current page number
 * @returns number - count of questions with changes
 */
export const getUnsavedQuestionsCount = (
  allQuestion: ContentType[],
  prevAllQuestion: ContentType[],
  currentPage: number
): number => {
  const currentPageQuestions = allQuestion.filter(
    (q) => q.page === currentPage
  );
  const prevPageQuestions = prevAllQuestion.filter(
    (q) => q.page === currentPage
  );

  // Count new questions
  let changedCount = Math.max(
    0,
    currentPageQuestions.length - prevPageQuestions.length
  );

  // Count modified questions
  const minLength = Math.min(
    currentPageQuestions.length,
    prevPageQuestions.length
  );
  for (let i = 0; i < minLength; i++) {
    const currentQ = currentPageQuestions[i];
    const prevQ = prevPageQuestions[i];

    if (
      JSON.stringify(currentQ.title) !== JSON.stringify(prevQ.title) ||
      currentQ.type !== prevQ.type ||
      currentQ.require !== prevQ.require ||
      currentQ.score !== prevQ.score ||
      JSON.stringify(currentQ.conditional) !==
        JSON.stringify(prevQ.conditional) ||
      JSON.stringify(currentQ[currentQ.type]) !==
        JSON.stringify(prevQ[prevQ.type]) ||
      JSON.stringify(currentQ.parentcontent) !==
        JSON.stringify(prevQ.parentcontent)
    ) {
      changedCount++;
    }
  }

  return changedCount;
};
