import { Checkbox, Input, Radio, Slider, Textarea } from "@nextui-org/react";
import { QuestionType, RangeType } from "../../../types/Form.types";
import { ChangeEvent } from "react";

interface AnswerComponent_Props<t> {
  onChange?: (val: t) => void;
  value?: t;
  name?: string;
  data?: {
    value: t;
    label: string;
  };
  choicety?: QuestionType.CheckBox | QuestionType.MultipleChoice;
  placeholder?: string;
}

export const Paragraph_Answer = (
  props: Omit<AnswerComponent_Props<string>, "choicety">
) => {
  return (
    <div className="paragraph_answer w-full h-fit flex flex-col items-center border-2 border-gray-200 rounded-2xl">
      <Textarea
        fullWidth
        color="default"
        isClearable
        size="lg"
        height={"100%"}
        value={props.value}
        maxRows={10}
        name={props.name}
        onChange={(e) => props.onChange && props.onChange(e.target.value)}
        onClear={() => props.onChange && props.onChange("")}
        placeholder={props.placeholder ?? "Type your answer here"}
      />
    </div>
  );
};

export const Choice_Answer = (props: AnswerComponent_Props<number>) => {
  return props.choicety === QuestionType.CheckBox ? (
    <Checkbox
      aria-label={props.name}
      className="w-full h-fit p-2 border-2 border-gray-300"
      checked={props.value === props.data?.value}
      size="md"
      name={props.name}
      onValueChange={(val) =>
        props.onChange && props.onChange(val ? props.data?.value ?? 0 : -1)
      }
    >
      <p className="text-lg font-medium w-full h-full">{props.data?.label}</p>
    </Checkbox>
  ) : (
    <Radio
      className="w-full h-fit p-2 border-2 border-gray-300"
      value={props.data?.value.toString() ?? ""}
    >
      <p className="text-lg font-medium w-full h-full">{props.data?.label}</p>
    </Radio>
  );
};

export const RangeNumber_Answer = (
  props: AnswerComponent_Props<RangeType<number>>
) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (props.onChange)
      props.onChange({
        ...props.value,
        [e.target.name]: Number(e.target.value),
      } as RangeType<number>);
  };
  return (
    <div className="w-full h-[70px] flex flex-col items-center gap-y-3">
      <Slider
        onChange={(val) => {
          if (props.onChange && Array.isArray(val))
            props.onChange({ start: val[0], end: val[1] });
        }}
        className="w-full h-full"
        value={[props.value?.start ?? 0, props.value?.end ?? 0]}
      />
      <div className="input_field w-full h-[30px] inline-flex items-center justify-between">
        <Input onChange={handleChange} name="start" label="Start" size="sm" />
        <Input onChange={handleChange} name="end" label="End" size="sm" />
      </div>
    </div>
  );
};
