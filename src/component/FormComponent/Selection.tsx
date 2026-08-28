import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Select,
  SelectItem,
  SelectProps,
} from "@heroui/react";
import { Key } from "react";
import { SelectionType } from "../../types/Global.types";

interface SelectionProps extends Omit<SelectProps, "children" | "aria-hidden"> {
  items: Array<SelectionType<string>>;
}

export default function Selection(props: SelectionProps) {
  return (
    <Select {...props} items={props.items}>
      {(item) => (
        <SelectItem key={item?.value} description={item.description}>
          {item.label}
        </SelectItem>
      )}
    </Select>
  );
}


interface DropDownMenu {
  item: Array<string>;
  onAction?: (key: Key) => void;
  isLink?: boolean;
}
export const DropDownMenu = (props: DropDownMenu) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          className="max-w-xs font-bold"
          variant={props.isLink ? "solid" : "bordered"}
          color="secondary"
        >
          {props.isLink ? `Linked` : "Action"}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="dropdown_menu" onAction={props.onAction}>
        {props.item.map((option) => (
          <DropdownItem key={option}>{option}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
