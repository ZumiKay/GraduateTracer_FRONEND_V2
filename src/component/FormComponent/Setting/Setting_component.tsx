import { useState, useRef, useEffect } from "react";
import { Input } from "@heroui/react";

interface CustomizeColorPicker {
  colors: Record<string, string>;
  value?: string;
  onChange: (val: string) => void;
}

export const CustomizeColorPicker = (props: CustomizeColorPicker) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customColor, setCustomColor] = useState(props.value || "#000000");
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Check if current value is a preset color
  const isPresetColor = Object.values(props.colors).includes(props.value || "");

  // Update custom color when value changes externally
  useEffect(() => {
    if (props.value && !isPresetColor) {
      setCustomColor(props.value);
      setIsCustom(true);
    }
  }, [props.value, isPresetColor]);

  const handleCustomColorChange = (color: string) => {
    // Validate hex color format
    const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
    setCustomColor(color);
    
    if (hexRegex.test(color)) {
      props.onChange(color);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    props.onChange(color);
  };

  return (
    <div className="w-fit h-fit flex flex-col gap-y-2">
      <div className="flex flex-row gap-x-3 items-center">
        {/* Preset colors */}
        {Object.entries(props.colors).map((color) => (
          <div
            key={color[0]}
            style={{
              backgroundColor: color[1],
              ...(color[1] === props.value ? { border: "5px solid black" } : {}),
            }}
            className={`w-[40px] h-[40px] cursor-pointer ${
              color[1] === props.value ? "border-[5px] border-gray-500" : ""
            } rounded-full transition-all hover:border-[5px] hover:border-gray-500`}
            onClick={() => {
              setIsCustom(false);
              props.onChange(color[1]);
            }}
          ></div>
        ))}

        {/* Custom color option */}
        <div
          style={{
            backgroundColor: isCustom || !isPresetColor ? customColor : "#FFFFFF",
            border: isCustom || !isPresetColor ? "5px solid black" : "2px solid #ccc",
          }}
          className="w-[40px] h-[40px] cursor-pointer rounded-full transition-all hover:border-[5px] hover:border-gray-500 relative"
          onClick={() => {
            setIsCustom(true);
            colorPickerRef.current?.click();
          }}
          title="Custom color"
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
            +
          </span>
        </div>
      </div>

      {/* Custom color inputs */}
      {(isCustom || !isPresetColor) && (
        <div className="flex flex-row gap-x-2 items-center">
          <input
            ref={colorPickerRef}
            type="color"
            value={customColor}
            onChange={handleColorPickerChange}
            className="w-[50px] h-[35px] cursor-pointer border border-gray-300 rounded"
          />
          <Input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            placeholder="#000000"
            className="w-[120px]"
            size="sm"
            startContent={
              <span className="text-gray-500 text-sm">#</span>
            }
            onBlur={() => {
              // Ensure valid hex format on blur
              if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(customColor)) {
                setCustomColor(props.value || "#000000");
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
