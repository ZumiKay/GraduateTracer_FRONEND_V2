import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
  SelectProps,
} from "@heroui/react";
import { SelectionType } from "../../types/Global.types";
import { ChromePicker, Color } from "react-color";
import { Key } from "react";

interface SelectionProps extends Omit<SelectProps, "children" | "aria-hidden"> {
  items: Array<SelectionType<string>>;
}

export default function Selection(props: SelectionProps) {
  return (
    <Select {...props} items={props.items}>
      {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
    </Select>
  );
}

interface ColorSelectionProps {
  value?: Color;
  onChange: (val: string) => void;
}

export const ColorSelection = ({ value, onChange }: ColorSelectionProps) => {
  return (
    <div className="colorselection w-fit h-fit">
      <Popover>
        <PopoverTrigger>
          <div
            style={
              value
                ? { backgroundColor: value as string }
                : { backgroundColor: "white" }
            }
            className={`selectedcolor w-[70px] h-[40px] border-2 border-gray-300 rounded-full
            }`}
          ></div>
        </PopoverTrigger>
        <PopoverContent>
          <div className="popover_content w-[200px] h-fit">
            <ChromePicker
              color={value}
              onChange={(e) => {
                onChange(e.hex);
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const BackgroundColorOption = [
  "#DAD3BE",
  "#D3F1DF",
  "#EFF3EA",
  "#FFF2C2",
  "#A5BFCC",
  "#86A788",
  "#ffffff",
];
export const BackgroundSelectionContainer = ({
  onSelect,
  value,
}: {
  value: string;
  onSelect: (val: string) => void;
}) => {
  return (
    <div className="w-fit max-w-[200px] gap-y-3 h-full flex flex-row gap-x-3 items-center flex-wrap">
      {BackgroundColorOption.map((color, idx) => (
        <div
          key={idx}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
          className={`w-[30px] h-[30px] rounded-full ${
            value === color ? "border-5 border-black" : ""
          } 0`}
        ></div>
      ))}
    </div>
  );
};

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
          color="primary"
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
