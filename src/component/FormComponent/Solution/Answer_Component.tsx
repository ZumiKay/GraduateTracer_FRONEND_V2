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
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  CalendarDate,
  CalendarDateTime,
  getLocalTimeZone,
  parseAbsoluteToLocal,
} from "@internationalized/date";
import { convertDateValueToString } from "../../../helperFunc";

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
  previousAnswer?: t; // For cases where we need to distinguish between question config and previous user input
  isDisable?: boolean;
}

export const ParagraphAnswer = (
  props: Omit<AnswerComponent_Props<string>, "choicety">
) => {
  return (
    <div className="paragraph_answer w-full h-fit flex flex-col items-center border-2 border-gray-200 rounded-2xl dark:text-white">
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
  const isSelected = props.value === props.data?.value;

  const baseCheckboxStyles = `
    w-full h-fit p-4 rounded-xl transition-all duration-200 ease-in-out
    border-2 
    ${
      isSelected
        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm"
        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50"
    }
    hover:border-primary-400 dark:hover:border-primary-500
    hover:shadow-md hover:scale-[1.01]
    ${props.isDisable ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
  `;

  const baseRadioStyles = `
    w-full h-fit p-4 mb-3 rounded-xl transition-all duration-200 ease-in-out
    border-2 
    border-gray-200 dark:border-gray-600 
    bg-white dark:bg-gray-800/50
    hover:border-primary-400 dark:hover:border-primary-500
    hover:shadow-md hover:scale-[1.01]
    data-[selected=true]:border-primary-500 
    data-[selected=true]:bg-primary-50 dark:data-[selected=true]:bg-primary-900/30
    data-[selected=true]:shadow-sm
    ${props.isDisable ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
  `;

  const labelStyles = `
    text-base font-medium leading-relaxed w-full h-full
    text-gray-700 dark:text-gray-200
    ${isSelected ? "text-primary-700 dark:text-primary-300" : ""}
  `;

  return props.choicety === QuestionType.CheckBox ? (
    <Checkbox
      aria-label={props.name}
      className={baseCheckboxStyles}
      checked={isSelected}
      size="md"
      name={props.name}
      onValueChange={(val) =>
        props.onChange && props.onChange(val ? props.data?.value ?? 0 : -1)
      }
      isDisabled={props.isDisable}
    >
      <p className={labelStyles}>{props.data?.label}</p>
    </Checkbox>
  ) : (
    <Radio
      className={baseRadioStyles}
      value={props.data?.value.toString() ?? ""}
      aria-label={props.name}
      isDisabled={props.isDisable}
    >
      <p className="text-base font-medium leading-relaxed w-full h-full text-gray-700 dark:text-gray-200">
        {props.data?.label}
      </p>
    </Radio>
  );
};

export const RangeNumberAnswer = (
  props: AnswerComponent_Props<RangeType<number>>
) => {
  const { value: questionRange, onChange, previousAnswer } = props;

  const [userSelection, setUserSelection] = useState<SliderValue | undefined>();

  // Initialize with previous answer only once
  useEffect(() => {
    if (previousAnswer) {
      setUserSelection([previousAnswer.start, previousAnswer.end]);
    }
  }, [previousAnswer]);

  // Initialize with question range only if no previous answer and no user selection
  useEffect(() => {
    if (questionRange && !previousAnswer && !userSelection) {
      setUserSelection([questionRange.start, questionRange.start]);
    }
  }, [questionRange, previousAnswer, userSelection]);

  // Handle slider changes with callback to prevent excessive calls
  const handleSliderChange = useCallback(
    (val: SliderValue) => {
      setUserSelection(val);

      // Only call onChange if we have a valid range
      if (onChange && val && Array.isArray(val)) {
        const [start, end] = val as number[];
        if (start <= end) {
          onChange({ start, end });
        }
      }
    },
    [onChange]
  );

  return (
    <div className="w-full h-fit flex flex-col items-center gap-y-3">
      <div className="flex flex-col gap-2 w-full h-full max-w-md items-start justify-center">
        {questionRange && (
          <>
            <p className="text-sm text-gray-600 dark:text-white mb-2">
              Available Range: {`${questionRange.start} - ${questionRange.end}`}
            </p>
            <Slider
              className="w-full h-full dark:text-white"
              value={userSelection}
              onChange={handleSliderChange}
              minValue={questionRange.start}
              maxValue={questionRange.end}
              aria-label={props.name || "Range selector"}
              isDisabled={props.readonly}
              step={1}
              marks={[
                {
                  value: questionRange.start,
                  label: String(questionRange.start),
                },
                {
                  value: questionRange.end,
                  label: String(questionRange.end),
                },
              ]}
            />
          </>
        )}
      </div>
      <div className="input_field max-w-md w-full h-[30px] inline-flex items-center justify-between gap-x-3">
        <Input
          value={userSelection ? String((userSelection as number[])[0]) : ""}
          name="start"
          label="Selected Start"
          labelPlacement="outside-left"
          isReadOnly
          size="lg"
          isDisabled={props.readonly}
        />
        <Input
          value={userSelection ? String((userSelection as number[])[1]) : ""}
          name="end"
          labelPlacement="outside-left"
          readOnly
          label="Selected End"
          size="lg"
          isDisabled={props.readonly}
        />
      </div>
    </div>
  );
};

export const DateQuestionType = (props: AnswerComponent_Props<string>) => {
  const { onChange, value: initialValue, placeholder, isDisable } = props;

  const [value, setvalue] = useState<DateValue | null>(null);
  useEffect(() => {
    if (initialValue) {
      setvalue(parseAbsoluteToLocal(initialValue));
    }
  }, [initialValue]);

  const handleChange = (val: DateValue) => {
    setvalue(val);
    if (!onChange) return;
    onChange(val.toDate(getLocalTimeZone()).toISOString());
  };

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <DatePicker
        size="lg"
        labelPlacement="outside-left"
        value={value}
        label={placeholder ?? "Date"}
        granularity="day"
        visibleMonths={2}
        onChange={(val) => handleChange(val as DateValue)}
        isDisabled={isDisable}
      />
    </div>
  );
};

export const DateRangePickerQuestionType = ({
  questionstate,
  setquestionstate,
}: {
  questionstate?: RangeValue<string>;
  setquestionstate: (name: string, val: string) => void;
}) => {
  const [value, setValue] = useState<RangeValue<DateValue | null>>({
    start: null,
    end: null,
  });

  // Initialize State
  useEffect(() => {
    if (questionstate?.start && questionstate?.end) {
      try {
        const convertedRange: RangeValue<DateValue> = {
          start: parseAbsoluteToLocal(questionstate.start),
          end: parseAbsoluteToLocal(questionstate.end),
        };

        setValue(convertedRange);
      } catch (error) {
        console.error("Error parsing date range:", error, { questionstate });
        // Fallback to today if parsing fails
      }
    }
  }, [questionstate]);

  const isEndBeforeStart = useMemo(() => {
    if (!value?.start || !value?.end) return false;
    return value.end.compare(value.start) < 0;
  }, [value]);

  const handleChangeDate = useCallback(
    (name: "start" | "end", val: CalendarDate | CalendarDateTime | null) => {
      if (val) {
        setquestionstate(name, convertDateValueToString(val));
      }
      setValue(
        (prev) => ({ ...(prev ?? {}), [name]: val } as RangeValue<DateValue>)
      );
    },
    [setquestionstate]
  );

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-4">
          <DatePicker
            value={value?.start}
            label="Start Date"
            showMonthAndYearPickers
            hideTimeZone
            granularity="day"
            labelPlacement="outside"
            onChange={(val) => handleChangeDate("start", val as never)}
            visibleMonths={2}
          />
          <DatePicker
            value={value?.end}
            label="End Date"
            labelPlacement="outside"
            showMonthAndYearPickers
            granularity="day"
            hideTimeZone
            onChange={(val) => handleChangeDate("end", val as never)}
            visibleMonths={2}
            isInvalid={isEndBeforeStart}
            errorMessage={
              isEndBeforeStart
                ? "End date must be after or equal to start date"
                : ""
            }
          />
        </div>

        {isEndBeforeStart && (
          <p className="text-tiny text-danger mt-1">
            Invalid date range: End date must be after or equal to start date
          </p>
        )}
      </div>
    </div>
  );
};
export const ShortAnswer = (props: AnswerComponent_Props<string>) => {
  return (
    <Input
      fullWidth
      size="lg"
      variant="bordered"
      classNames={{
        input: "dark:text-white",
      }}
      placeholder={props.placeholder ?? "Type your answer here"}
      onChange={(e) => props.onChange && props.onChange(e.target.value)}
      value={props.value}
      aria-label={props.name}
      isReadOnly={props.readonly}
      isDisabled={props.isDisable}
    />
  );
};
