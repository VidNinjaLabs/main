import { forwardRef } from "react";

interface HorizontalMediaGridProps {
  children?: React.ReactNode;
}

export const HorizontalMediaGrid = forwardRef<
  HTMLDivElement,
  HorizontalMediaGridProps
>((props, ref) => {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      ref={ref}
    >
      {props.children}
    </div>
  );
});

HorizontalMediaGrid.displayName = "HorizontalMediaGrid";
