// Simple test script to verify conditional validation logic
console.log("Testing conditional validation...");

// Mock data structure
const questions = [
  {
    _id: "q1",
    type: "MULTIPLE_CHOICE",
    require: true,
    title: "Do you have experience?",
    multiple: [
      { idx: 0, content: "Yes" },
      { idx: 1, content: "No" },
    ],
  },
  {
    _id: "q2",
    type: "TEXT",
    require: true,
    title: "How many years?",
    parentcontent: { qId: "q1", optIdx: 0 }, // Show only if q1 = "Yes" (index 0)
  },
  {
    _id: "q3",
    type: "TEXT",
    require: true,
    title: "What's your name?",
    // No parent - always visible
  },
];

const responses = [
  { questionId: "q1", response: 0 }, // Selected "Yes"
  { questionId: "q3", response: "John Doe" },
  // q2 is missing but should be required since q1 = 0
];

// Mock checkIfQuestionShouldShow function
function checkIfQuestionShouldShow(question, responseList) {
  if (!question.parentcontent) return true;

  const parentResponse = responseList.find(
    (r) => r.questionId === question.parentcontent.qId
  );
  if (
    !parentResponse ||
    parentResponse.response === "" ||
    parentResponse.response === null
  ) {
    return false;
  }

  return parentResponse.response === question.parentcontent.optIdx;
}

// Test the logic
console.log("=== Testing Question Visibility ===");
questions.forEach((q) => {
  const isVisible = checkIfQuestionShouldShow(q, responses);
  const response = responses.find((r) => r.questionId === q._id);
  const hasResponse =
    response && response.response !== "" && response.response !== null;

  console.log(`Question ${q._id}:`, {
    title: q.title,
    required: q.require,
    isVisible,
    hasResponse,
    shouldFailValidation: q.require && isVisible && !hasResponse,
  });
});

// Test validation logic
const visibleRequiredQuestions = questions.filter((q) => {
  const isVisible = checkIfQuestionShouldShow(q, responses);
  return q.require && isVisible;
});

const missingResponses = visibleRequiredQuestions.filter((q) => {
  const response = responses.find((r) => r.questionId === q._id);
  return !response || response.response === "" || response.response === null;
});

console.log("\n=== Validation Results ===");
console.log(
  "Visible required questions:",
  visibleRequiredQuestions.map((q) => q._id)
);
console.log(
  "Missing responses:",
  missingResponses.map((q) => q._id)
);
console.log("Should validation pass?", missingResponses.length === 0);
