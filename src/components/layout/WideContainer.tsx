import { ReactNode } from "react";

interface WideContainerProps {
  classNames?: string;
  children?: ReactNode;
  ultraWide?: boolean;
  topMargin?: string; // Custom top margin, defaults to responsive margin
}

export function WideContainer(props: WideContainerProps) {
  const marginTop = props.topMargin ?? "mt-3 md:mt-6";

  return (
    <div
      className={`mx-auto max-w-full md:px-12 ${marginTop} ${
        props.ultraWide
          ? "w-full max-w-[1920px] "
          : "w-full max-w-[1600px] !px-0"
      } ${props.classNames || ""}`}
    >
      {props.children}
    </div>
  );
}
