import React from "react";
import { Pagination, Button } from "@heroui/react";
import { useSearchParams } from "react-router";

const RowPerPage = ["5", "10", "20"];

interface FormpaginationProps {
  total: number;
  onPageChange: (val: number) => void;
  onLimitChange: (val: number) => void;
  totalCount?: number;
  currentItems?: number;
}

export default function FormPagination({
  total,
  onPageChange,
  onLimitChange,
  totalCount,
  currentItems,
}: FormpaginationProps) {
  const [param, setparam] = useSearchParams();
  const [currentPage, setCurrentPage] = React.useState(
    Number(param.get("page")) || 1
  );
  const [showperpage, setshowperpage] = React.useState(
    Number(param.get("show")) || 5
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setshowperpage(parseInt(e.target.value));
    handleParam(e.target.name, e.target.value);
    onLimitChange(Number(e.target.value));
  };

  const handleParam = (name: string, value: string) => {
    if (value.length === 0) {
      param.delete(name);
    } else {
      if (param.has(name)) {
        param.set(name, value);
      } else param.append(name, value);
      setparam(param);
    }
  };
  return (
    <div className="w-full h-fit flex flex-col items-center gap-5 bg-white p-4 rounded-lg shadow-sm border">
      {/* Pagination info */}
      {totalCount && (
        <div className="text-sm text-default-500 text-center">
          Showing {currentItems || 0} of {totalCount} forms (Page {currentPage}{" "}
          of {total})
        </div>
      )}

      <div className="flex justify-center">
        <Pagination
          color="secondary"
          page={currentPage}
          total={total ?? 1}
          onChange={(val) => {
            handleParam("page", val ? val.toString() : "1");
            setCurrentPage(val);
            onPageChange(val);
          }}
          className="flex justify-center"
        />
      </div>
      <div className="flex gap-3 items-center justify-center">
        <Button
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 font-bold text-white transition-all duration-200"
          size="sm"
          variant="flat"
          disabled={currentPage <= 1}
          onPress={() => {
            setCurrentPage((prev) => {
              const nxt = prev - 1;
              if (nxt >= 1) {
                handleParam("page", nxt.toString());
                onPageChange(nxt);
                return nxt;
              } else {
                return 1;
              }
            });
          }}
        >
          Previous
        </Button>
        <Button
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 font-bold text-white transition-all duration-200"
          size="sm"
          variant="flat"
          disabled={currentPage >= total}
          onPress={() => {
            setCurrentPage((prev) => {
              const nxt = prev + 1;
              if (prev < total) {
                handleParam("page", nxt.toString());
                onPageChange(nxt);
                return nxt;
              } else {
                return total;
              }
            });
          }}
        >
          Next
        </Button>
        <label className="flex items-center text-default-600 text-small ml-4">
          Rows per page:
          <select
            onChange={handleChange}
            name="show"
            value={showperpage}
            className="bg-transparent outline-none text-default-400 text-small ml-2 border-b border-default-300 focus:border-primary"
          >
            {RowPerPage.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
