import React from "react";
import { Pagination, Button } from "@nextui-org/react";
import { useSearchParams } from "react-router";

const RowPerPage = ["5", "10", "20"];

interface FormpaginationProps {
  total: number;
  onPageChange: (val: number) => void;
  onLimitChange: (val: number) => void;
}

export default function FormPagination({
  total,
  onPageChange,
  onLimitChange,
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
    <div className="w-full h-fit flex flex-col gap-5">
      <Pagination
        color="secondary"
        page={currentPage}
        total={total ?? 1}
        onChange={(val) => {
          handleParam("page", val ? val.toString() : "1");
          setCurrentPage(val);
          onPageChange(val);
        }}
      />
      <div className="flex gap-2">
        <Button
          className="bg-primary font-bold text-white"
          size="sm"
          variant="flat"
          onPress={() => {
            setCurrentPage((prev) => {
              const nxt = prev - 1;
              if (nxt >= 1) {
                handleParam("page", nxt.toString());
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
          color="secondary"
          size="sm"
          variant="flat"
          onPress={() => {
            setCurrentPage((prev) => {
              const nxt = prev + 1;
              if (prev < total) {
                handleParam("page", nxt.toString());
                return nxt;
              } else {
                return total;
              }
            });
          }}
        >
          Next
        </Button>
        <label className="flex items-center text-default-500 text-small">
          Rows per page:
          <select
            onChange={handleChange}
            name="show"
            value={showperpage}
            className="bg-transparent outline-none text-default-400 text-small"
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
