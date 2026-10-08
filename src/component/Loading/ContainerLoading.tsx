import { Skeleton } from "@heroui/react";


export const CardLoading = () => {
  return <Skeleton className="w-[300px] h-[200px] rounded-lg" />;
};

export const QuestionLoading = ({ count = 1 }: { count: number }) => {
  return Array.from({ length: count }).map((_, idx) => (
    <Skeleton
      key={`loading ${idx}`}
      className="w-card_respondant_width h-card_respondant_height rounded-lg"
    />
  ));
};
