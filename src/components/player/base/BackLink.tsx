import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { LucideIcon } from "@/components/LucideIcon";

export function BackLink(props: { url: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      <Link
        to={props.url}
        className="p-3 tabbable rounded-full bg-video-context-background hover:bg-video-context-hoverColor flex items-center cursor-pointer text-white transition-colors duration-200"
      >
        <LucideIcon icon={ArrowLeft} />
      </Link>
    </div>
  );
}
