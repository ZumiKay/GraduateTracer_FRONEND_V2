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
import { ChromePicker, Color } from "react-color";
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

interface ColorSelectionProps {
  value?: Color;
  onChange: (val: string) => void;
}

export const ColorSelection = ({ value, onChange }: ColorSelectionProps) => {
  return (
    <div className="colorselection w-fit h-fit">
      <Popover>
        <PopoverTrigger>
          <button
            type="button"
            aria-label="Select color"
            style={{
              backgroundColor: value ? (value as string) : "white",
            }}
            className="selectedcolor w-[70px] h-[40px] border-2 border-gray-300 dark:border-gray-600 rounded-full cursor-pointer"
          />
        </PopoverTrigger>
        <PopoverContent className="dark:bg-gray-800">
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
    <div
      className="w-fit max-w-[200px] gap-y-3 h-full flex flex-row gap-x-3 items-center flex-wrap"
      role="radiogroup"
      aria-label="Background color selection"
    >
      {BackgroundColorOption.map((color, idx) => (
        <button
          key={idx}
          type="button"
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
          aria-label={`Select background color ${color}`}
          aria-pressed={value === color}
          className={`w-[30px] h-[30px] rounded-full cursor-pointer ${
            value === color ? "border-5 border-black" : ""
          }`}
        />
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
