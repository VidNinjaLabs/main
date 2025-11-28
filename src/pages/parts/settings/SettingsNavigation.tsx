import classNames from "classnames";
import {
  Captions,
  Link as LinkIcon,
  LucideIcon as LucideIconType,
  Paintbrush,
  Server,
  Settings2,
  User,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Icon, Icons } from "@/components/Icon";
import { LucideIcon } from "@/components/LucideIcon";

function SettingsTab(props: {
  children: React.ReactNode;
  icon: Icons | React.ElementType;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={classNames(
        "tabbable px-4 py-2 flex items-center space-x-2 cursor-pointer rounded-lg transition-colors duration-200",
        props.active
          ? "bg-white text-black"
          : "text-gray-400 hover:text-white hover:bg-white/10",
      )}
    >
      {typeof props.icon === "string" ? (
        <Icon
          className={classNames("text-xl", props.active ? "text-black" : "")}
          icon={props.icon as Icons}
        />
      ) : (
        <LucideIcon
          className={classNames("text-xl", props.active ? "text-black" : "")}
          icon={props.icon as LucideIconType}
        />
      )}
      <span className="font-medium">{props.children}</span>
    </button>
  );
}

export function SettingsNavigation(props: {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}) {
  const { t } = useTranslation();

  const settingLinks = useMemo(
    () => [
      {
        textKey: "settings.account.title",
        id: "settings-account",
        icon: User,
      },
      {
        textKey: "settings.preferences.title",
        id: "settings-preferences",
        icon: Settings2,
      },
      {
        textKey: "settings.appearance.title",
        id: "settings-appearance",
        icon: Paintbrush,
      },
      {
        textKey: "settings.subtitles.title",
        id: "settings-captions",
        icon: Captions,
      },
      {
        textKey: "settings.connections.title",
        id: "settings-connection",
        icon: LinkIcon,
      },
      {
        textKey: "settings.providers.title",
        id: "settings-providers",
        icon: Server,
      },
    ],
    [],
  );

  return (
    <div className="flex items-center justify-center w-full mb-8">
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 px-2 bg-video-context-background/50 rounded-lg border border-video-context-border backdrop-blur-md">
        {settingLinks.map((v) => (
          <SettingsTab
            icon={v.icon}
            active={v.id === props.selectedCategory}
            onClick={() => props.setSelectedCategory(v.id)}
            key={v.id}
          >
            {t(v.textKey)}
          </SettingsTab>
        ))}
      </div>
    </div>
  );
}
