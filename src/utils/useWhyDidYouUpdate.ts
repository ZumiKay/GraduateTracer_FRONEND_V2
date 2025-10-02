import { useEffect, useRef } from "react";

// Custom hook to debug why a component re-rendered
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, unknown>
) {
  // Get a mutable ref object where we can store props for comparison next time this hook runs.
  const previousProps = useRef<Record<string, unknown>>();

  useEffect(() => {
    if (previousProps.current) {
      // Get all keys from previous and current props
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      // Use this object to keep track of changed props
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      // Iterate through keys
      allKeys.forEach((key) => {
        // Check if the prop changed
        if (previousProps.current![key] !== props[key]) {
          // Add to changedProps object
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      // If any props changed, log them
      if (Object.keys(changedProps).length) {
        console.log("[why-did-you-update]", name, changedProps);
      }
    }

    // Finally update previousProps with current props for next hook call
    previousProps.current = props;
  });
}

// Hook to track component renders
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[${componentName}] Render count:`, renderCount.current);
  });

  return renderCount.current;
}
