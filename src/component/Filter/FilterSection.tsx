import { Input } from "@nextui-org/react";
import { SelectionType } from "../../types/Global.types";
import Selection from "../FormComponent/Selection";
import { SearchIcon } from "../svg/GeneralIcon";
import { useState } from "react";
import { useSearchParams } from "react-router";

const FilterOption: Array<SelectionType<string>> = [
  { label: "Owned", value: "owned" },
  { label: "Not Owned", value: "notowned" },
];
const OrderOption: Array<SelectionType<string>> = [
  { label: "Last Modified", value: "edited" },
  { label: "Last Created", value: "created" },
];

export default function FilterSection() {
  const [param, setparam] = useSearchParams();
  const [Filterstate, setFilterstate] = useState({
    filter: param.get("filter") || "",
    order: param.get("order") || "",
    q: param.get("q") || "",
  });

  const handleParam = (name: string, value: string) => {
    if (value.length === 0) {
      param.delete(name);
    } else {
      if (param.has(name)) {
        param.set(name, value);
      } else param.append(name, value);
    }
    setparam(param);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterstate((prev) => ({ ...prev, [name]: value }));
    handleParam(name, value);
  };

  return (
    <div className="filtersection w-full h-fit relative inline-flex items-center gap-x-5">
      <Selection
        items={FilterOption}
        placeholder="Filter By"
        size="md"
        name="filter"
        aria-label="Filter By"
        selectedKeys={[Filterstate.filter]}
        className="w-[150px] h-full font-bold"
        onChange={handleChange}
      />
      <Selection
        items={OrderOption}
        placeholder="Order By"
        name="order"
        selectedKeys={[Filterstate.order]}
        onChange={handleChange}
        aria-label="Order By"
        size="md"
        className="w-[150px] h-full font-bold"
      />
      <Input
        startContent={<SearchIcon />}
        type="Search"
        aria-label="Search"
        value={Filterstate.q}
        onChange={(e) => setFilterstate({ ...Filterstate, q: e.target.value })}
        onBlur={() => handleParam("q", Filterstate.q)}
        className="max-w-md h-full"
        placeholder="Search Name"
        onClear={() => {
          param.delete("q");
          setFilterstate({ ...Filterstate, q: "" });
          setparam(param);
        }}
        name="q"
      />
    </div>
  );
}
