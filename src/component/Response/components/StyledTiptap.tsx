import React from "react";
import Tiptap from "../../FormComponent/TipTabEditor";
import { JSONContent } from "@tiptap/react";

interface StyledTiptapProps {
  value: JSONContent | string;
  readonly?: boolean;
  className?: string;
  variant?: "question" | "content" | "default";
}

const StyledTiptap: React.FC<StyledTiptapProps> = ({
  value,
  readonly = true,
  className = "",
  variant = "default",
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "question":
        return "text-base font-medium text-gray-900 dark:text-white leading-relaxed mb-3 prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-700 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:text-gray-700 prose-ol:text-gray-700";
      case "content":
        return "text-sm text-gray-600 leading-relaxed dark:text-white prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-strong:text-gray-800 prose-em:text-gray-600";
      default:
        return "text-sm text-gray-700 dark:text-white leading-relaxed prose prose-sm max-w-none";
    }
  };

  // Convert string to JSONContent if needed
  const processedValue: JSONContent =
    typeof value === "string"
      ? {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: value }] },
          ],
        }
      : value;

  return (
    <div
      className={`
        ${getVariantClasses()}
        ${readonly ? "pointer-events-none" : ""}
        ${className}
      `}
      style={
        {
          "--tw-prose-bullets": "#6b7280",
          "--tw-prose-counters": "#6b7280",
        } as React.CSSProperties
      }
    >
      <Tiptap value={processedValue} readonly={readonly} />
    </div>
  );
};

export default StyledTiptap;
