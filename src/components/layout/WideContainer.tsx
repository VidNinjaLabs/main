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
      className={`mx-auto max-w-full px-2 ${marginTop} ${
        props.ultraWide
          ? "w-[1300px] xl:w-[1800px] 3xl:w-[2400px] 4xl:w-[2800px]"
          : "w-[950px] xl:w-[1250px] 3xl:w-[1650px] 4xl:w-[1850px]"
      } ${props.classNames || ""}`}
    >
      {props.children}
    </div>
  );
}
