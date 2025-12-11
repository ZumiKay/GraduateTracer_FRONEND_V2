import { Input } from "@heroui/react";
import { DashboardFilterType, SelectionType } from "../../types/Global.types";
import Selection from "../FormComponent/Selection";
import { SearchIcon } from "../svg/GeneralIcon";
import { useSearchParams } from "react-router";
import { useCallback, useEffect } from "react";

const orderOptions: Array<SelectionType<string>> = [
  {
    label: "Last Created",
    value: "created:-1",
  },
  {
    label: "First Created",
    value: "created:1",
  },
  {
    label: "Last Modified",
    value: "updated:-1",
  },
  {
    label: "First Modified",
    value: "updated:1",
  },
];

export default function FilterSection({
  Filterstate,
  setFilterstate,
}: {
  Filterstate: DashboardFilterType;
  setFilterstate: React.Dispatch<React.SetStateAction<DashboardFilterType>>;
}) {
  const [param, setparam] = useSearchParams();

  // Verify and clean up search parameters on mount and when params change
  useEffect(() => {
    const verifySearchParams = () => {
      const hasCreated = param.has("created");
      const hasUpdated = param.has("updated");

      // If both created and updated parameters exist, remove them
      if (hasCreated && hasUpdated) {
        param.delete("created");
        param.delete("updated");
        setparam(param);

        // Also reset the filter state
        setFilterstate((prev) => ({
          ...prev,
          created: "",
          updated: "",
        }));

        console.warn(
          "Both created and updated parameters found. Removing both to avoid conflicts."
        );
      }
    };

    verifySearchParams();
  }, [param, setparam, setFilterstate]);

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

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;

    const [orderType, orderValue] = value.split(":");

    // Reset both order states first
    setFilterstate((prev) => ({
      ...prev,
      created: orderType === "created" ? orderValue : "",
      updated: orderType === "updated" ? orderValue : "",
    }));

    // Update URL parameters
    if (orderType === "created") {
      handleParam("created", orderValue);
      param.delete("updated");
    } else {
      handleParam("updated", orderValue);
      param.delete("created");
    }
    setparam(param);
  };

  // Get current selected order value for display
  const getCurrentOrderValue = useCallback(() => {
    if (Filterstate.created) {
      return `created:${Filterstate.created}`;
    }
    if (Filterstate.updated) {
      return `updated:${Filterstate.updated}`;
    }
    return "";
  }, [Filterstate.created, Filterstate.updated]);

  return (
    <div className="filtersection w-full h-fit relative inline-flex items-center gap-x-5">
      <Selection
        items={orderOptions}
        placeholder="Order By"
        name="order"
        selectedKeys={[getCurrentOrderValue()]}
        onChange={handleOrderChange}
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
        onBlur={() => Filterstate.q && handleParam("q", Filterstate.q)}
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
