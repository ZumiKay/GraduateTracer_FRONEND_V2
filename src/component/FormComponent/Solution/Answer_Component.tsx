import {
  Checkbox,
  DatePicker,
  DateValue,
  Input,
  Radio,
  RangeValue,
  Slider,
  SliderValue,
  Textarea,
} from "@heroui/react";
import { QuestionType, RangeType } from "../../../types/Form.types";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDate,
  CalendarDateTime,
  parseDate,
} from "@internationalized/date";

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
  readonly?: boolean;
  isDisable?: boolean;
}

export const ParagraphAnswer = (
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
        aria-label={props.name}
        maxRows={10}
        name={props.name}
        onChange={(e) => props.onChange && props.onChange(e.target.value)}
        onClear={() => props.onChange && props.onChange("")}
        placeholder={props.placeholder ?? "Type your answer here"}
        isReadOnly={props.readonly}
        isDisabled={props.isDisable}
      />
    </div>
  );
};

export const ChoiceAnswer = (props: AnswerComponent_Props<number>) => {
  return props.choicety === QuestionType.CheckBox ? (
    <Checkbox
      aria-label={props.name}
      className="w-full h-fit p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors duration-200"
      checked={props.value === props.data?.value}
      size="md"
      name={props.name}
      onValueChange={(val) =>
        props.onChange && props.onChange(val ? props.data?.value ?? 0 : -1)
      }
      isDisabled={props.isDisable}
    >
      <p className="text-base font-medium text-gray-800 w-full h-full leading-relaxed">
        {props.data?.label}
      </p>
    </Checkbox>
  ) : (
    <Radio
      className="w-full h-fit p-3 mb-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors duration-200"
      value={props.data?.value.toString() ?? ""}
      aria-label={props.name}
      isDisabled={props.isDisable}
    >
      <p className="text-base font-medium text-gray-800 w-full h-full leading-relaxed">
        {props.data?.label}
      </p>
    </Radio>
  );
};

export const RangeNumberAnswer = (
  props: AnswerComponent_Props<RangeType<number>>
) => {
  const [value, setValue] = useState<SliderValue>([
    props.value?.start ?? 0,
    props.value?.end ?? 0,
  ]);

  useEffect(() => {
    if (props.onChange) {
      ///Set Value
      const val = value as number[];
      props.onChange({ start: val[0], end: val[1] });
    }
  }, [props, value]);
  return (
    <div className="w-full h-fit flex flex-col items-center gap-y-3">
      <div className="flex flex-col gap-2 w-full h-full max-w-md items-start justify-center">
        <Slider
          className="w-full h-full"
          value={value}
          onChange={setValue}
          maxValue={props.value?.end ?? 0}
          aria-label={props.name}
          isDisabled={props.isDisable}
        />
      </div>
      <div className="input_field max-w-md w-full h-[30px] inline-flex items-center justify-between gap-x-3">
        <Input
          value={value[0 as never]}
          name="start"
          label="Start"
          labelPlacement="outside-left"
          isReadOnly
          size="lg"
          isDisabled={props.isDisable}
        />
        <Input
          value={value[1 as never]}
          name="end"
          labelPlacement="outside-left"
          readOnly
          label="End"
          size="lg"
          isDisabled={props.isDisable}
        />
      </div>
    </div>
  );
};

export const DateQuestionType = (props: AnswerComponent_Props<Date>) => {
  const [value, setvalue] = useState<DateValue | null>(
    props.value ? parseDate(props.value.toString()) : null
  );

  useEffect(() => {
    if (props.onChange) {
      if (value) {
        props.onChange(new Date(value.toString()));
      }
    }
  }, [props, value]);

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <DatePicker
        size="lg"
        labelPlacement="outside-left"
        value={value}
        label={props.placeholder ?? "Date"}
        visibleMonths={2}
        onChange={setvalue}
        isDisabled={props.isDisable}
      />
    </div>
  );
};

export const DateRangePickerQuestionType = ({
  questionstate,
  setquestionstate,
}: {
  questionstate?: RangeValue<DateValue>;
  setquestionstate: (name: string, val: DateValue) => void;
}) => {
  const [value, setValue] = useState<RangeValue<DateValue> | null>(
    questionstate ?? null
  );

  const handleChangeDate = useCallback(
    (name: string, val: CalendarDate | CalendarDateTime | null) => {
      if (val) setquestionstate(name, val);
      setValue((prev) => ({ ...prev, [name]: val } as never));
    },
    [setquestionstate]
  );

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <DatePicker
        value={value?.start}
        label={"Start Date"}
        labelPlacement="outside"
        onChange={(val) => handleChangeDate("start", val as never)}
        visibleMonths={2}
      />
      <DatePicker
        value={value?.end}
        label={"End Date"}
        labelPlacement="outside"
        onChange={(val) => handleChangeDate("end", val as never)}
        visibleMonths={2}
      />
    </div>
  );
};

export const ShortAnswer = (props: AnswerComponent_Props<string>) => {
  return (
    <Input
      fullWidth
      size="lg"
      variant="bordered"
      placeholder={props.placeholder ?? "Type your answer here"}
      onChange={(e) => props.onChange && props.onChange(e.target.value)}
      value={props.value}
      aria-label={props.name}
      isReadOnly={props.readonly}
      isDisabled={props.isDisable}
    />
  );
};
