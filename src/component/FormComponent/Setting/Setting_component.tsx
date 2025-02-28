interface CustomizeColorPicker {
  colors: Record<string, string>;
  value?: string;
  onChange: (val: string) => void;
}

export const CustomizeColorPicker = (props: CustomizeColorPicker) => {
  return (
    <div className="w-fit h-[50px] flex flex-row gap-x-3 items-center">
      {Object.entries(props.colors).map((color) => (
        <div
          key={color[0]}
          style={{
            backgroundColor: color[1],
            ...(color[1] === props.value ? { border: "5px solid black" } : {}),
          }}
          className={`w-[40px] h-[40px] ${
            color[1] === props.value ? "border-[5px] border-gray-500" : ""
          } rounded-full 
          }] transition-all hover:border-[5px] hover:border-gray-500`}
          onClick={() => props.onChange(color[1])}
        ></div>
      ))}
    </div>
  );
};
