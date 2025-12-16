import classNames from "classnames";

import { useIsMobile } from "@/hooks/useIsMobile";

export function BrandPill(props: {
  clickable?: boolean;
  header?: boolean;
  backgroundClass?: string;
  className?: string;
  iconClass?: string;
}) {
  const isMobile = useIsMobile();

  return (
    <div
      className={classNames(
        "flex items-center space-x-2 rounded-full px-2 py-2",
        props.backgroundClass ?? "bg-pill-background bg-opacity-0",
        props.clickable
          ? "transition-[transform,background-color] hover:scale-105 active:scale-95"
          : "",
        props.className,
      )}
    >
      <img
        src="/logo.svg"
        alt="VidNinja"
        className={classNames(
          "h-10 md:h-12 w-auto",
          props.iconClass,
        )}
      />
      {!isMobile && !props.header && (
        <span className="font-semibold text-white text-xl">VidNinja</span>
      )}
    </div>
  );
}

