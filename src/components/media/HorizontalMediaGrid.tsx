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
      className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6"
      ref={ref}
    >
      {props.children}
    </div>
  );
});

HorizontalMediaGrid.displayName = "HorizontalMediaGrid";
