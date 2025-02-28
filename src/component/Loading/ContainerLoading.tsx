import { CircularProgress, Skeleton } from "@heroui/react";

export default function ContainerLoading() {
  return (
    <div className="bg-white absolute top-0 left-0 w-full h-full grid place-content-center z-50">
      <div className="loading_container w-[150px] h-[150px] bg-white rounded-md flex justify-center">
        <CircularProgress aria-label="loading" color="secondary" size="lg" />
      </div>
    </div>
  );
}

export const CardLoading = () => {
  return <Skeleton className="w-[300px] h-[200px] rounded-lg" />;
};

export const QuestionLoading = ({ count = 1 }: { count: number }) => {
  return Array.from({ length: count }).map(() => (
    <Skeleton className="w-card_respondant_width h-card_respondant_height rounded-lg" />
  ));
};
