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
    <div className="w-full sm:w-fit h-fit flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center">
        {/* Preset colors */}
        {Object.entries(props.colors).map((color) => {
          const isSelected = color[1] === props.value;
          return (
            <button
              key={color[0]}
              type="button"
              aria-label={`Color preset ${color[0]}`}
              style={{
                backgroundColor: color[1],
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 cursor-pointer rounded-full transition-all hover:scale-105 active:scale-95 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 scale-105 border-2 border-white dark:border-gray-900"
                  : "border border-black/15 dark:border-white/15 hover:border-black/40"
              }`}
              onClick={() => {
                setIsCustom(false);
                props.onChange(color[1]);
              }}
            />
          );
        })}

        {/* Custom color option */}
        <button
          type="button"
          aria-label="Custom color picker"
          style={{
            backgroundColor: isCustom || !isPresetColor ? customColor : undefined,
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 cursor-pointer rounded-full transition-all hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
            isCustom || !isPresetColor
              ? "ring-2 ring-primary ring-offset-2 scale-105 border-2 border-white dark:border-gray-900"
              : "border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          onClick={() => {
            setIsCustom(true);
            colorPickerRef.current?.click();
          }}
          title="Custom color"
        >
          <span
            className={`text-xs font-bold leading-none ${
              isCustom || !isPresetColor
                ? "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            +
          </span>
        </button>
      </div>

      {/* Custom color inputs */}
      {(isCustom || !isPresetColor) && (
        <div className="flex flex-row gap-2 items-center pt-0.5">
          <input
            ref={colorPickerRef}
            type="color"
            value={customColor}
            onChange={handleColorPickerChange}
            aria-label="Color wheel"
            className="w-8 h-8 sm:w-9 sm:h-8 cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg p-0.5 bg-transparent shrink-0"
          />
          <Input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            placeholder="#000000"
            className="w-28 sm:w-32"
            size="sm"
            startContent={
              <span className="text-gray-500 text-xs sm:text-sm">#</span>
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
