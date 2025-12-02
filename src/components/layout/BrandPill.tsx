import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "@/hooks/useIsMobile";

export function BrandPill(props: {
  clickable?: boolean;
  header?: boolean;
  backgroundClass?: string;
  className?: string;
  iconClass?: string;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div
      className={classNames(
        "flex items-center space-x-2 rounded-full px-2 py-2 text-type-logo",
        props.backgroundClass ?? "bg-pill-background bg-opacity-0",
        props.clickable
          ? "transition-[transform,background-color] hover:scale-105 hover:text-type-logo active:scale-95"
          : "",
        props.className,
      )}
    >
      <img
        src="/logo.png"
        className={classNames("h-12 w-auto", props.iconClass)}
        alt="Logo"
      />
      <span
        className={[
          "font-semibold text-white",
          isMobile && props.header ? "hidden sm:block" : "",
        ].join(" ")}
      >
        {/* {t("global.name")} */}
      </span>
    </div>
  );
}
