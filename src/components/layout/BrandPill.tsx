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
  const { t: _t } = useTranslation();
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
      <span
        style={{ fontFamily: "'Plaster', system-ui" }}
        className={classNames(
          "text-6xl md:text-5xl text-type-logo leading-none pb-1",
          props.iconClass,
        )}
      >
        <span className="block md:hidden">V</span>
        <span className="hidden md:block">VidNinja</span>
      </span>
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
