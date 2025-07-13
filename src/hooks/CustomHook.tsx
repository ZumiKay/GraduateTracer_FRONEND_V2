import { useSearchParams } from "react-router";

export const useSetSearchParam = () => {
  const [searchParam, setSearchParam] = useSearchParams();

  const setParams = (newParam: Record<string, string>) => {
    const currentParam = Object.fromEntries(searchParam.entries()); // Convert existing params to object

    const updatedParams = { ...currentParam, ...newParam }; // Merge new params

    setSearchParam(updatedParams); // Update URL search params
  };

  return { searchParam, setParams };
};
