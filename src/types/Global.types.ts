export interface SelectionType<t> {
  label: string;
  value: t;
}

export interface ShowLinkedQuestionType {
  question: number | string;
  show?: boolean;
}
