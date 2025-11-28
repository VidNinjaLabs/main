import { Captions, Server, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getCachedMetadata } from "@/backend/api/metadata";
import { Toggle } from "@/components/buttons/Toggle";
import { Icon, Icons } from "@/components/Icon";
import { LucideIcon } from "@/components/LucideIcon";
import { useCaptions } from "@/components/player/hooks/useCaptions";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";
import { qualityToString } from "@/stores/player/utils/qualities";
import { usePreferencesStore } from "@/stores/preferences";
import { useSubtitleStore } from "@/stores/subtitles";
import { getPrettyLanguageNameFromLocale } from "@/utils/language";

export function SettingsMenu({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const selectedCaptionLanguage = usePlayerStore(
    (s) => s.caption.selected?.language,
  );
  const subtitlesEnabled = useSubtitleStore((s) => s.enabled);
  const currentSourceId = usePlayerStore((s) => s.sourceId);
  const providerNames = usePreferencesStore((s) => s.providerNames);
  const sourceName = useMemo(() => {
    if (!currentSourceId) return "...";
    const source = getCachedMetadata().find(
      (src) => src.id === currentSourceId,
    );
    return providerNames[currentSourceId] ?? source?.name ?? "...";
  }, [currentSourceId, providerNames]);
  const { toggleLastUsed } = useCaptions();

  const selectedLanguagePretty = selectedCaptionLanguage
    ? (getPrettyLanguageNameFromLocale(selectedCaptionLanguage) ??
      t("player.menus.subtitles.unknownLanguage"))
    : undefined;

  const source = usePlayerStore((s) => s.source);

  const downloadable = source?.type === "file" || source?.type === "hls";

  return (
    <Menu.Card>
      <Menu.Section>
        <Menu.ChevronLink
          onClick={() => router.navigate("/quality")}
          rightText={currentQuality ? qualityToString(currentQuality) : ""}
        >
          <div className="flex items-center gap-3">
            <LucideIcon icon={SlidersHorizontal} className="text-xl" />
            <span>{t("player.menus.settings.qualityItem")}</span>
          </div>
        </Menu.ChevronLink>
        <Menu.ChevronLink
          onClick={() => router.navigate("/source")}
          rightText={sourceName}
        >
          <div className="flex items-center gap-3">
            <LucideIcon icon={Server} className="text-xl" />
            <span>{t("player.menus.settings.sourceItem")}</span>
          </div>
        </Menu.ChevronLink>
        <Menu.ChevronLink
          onClick={() => router.navigate("/captions")}
          rightText={
            selectedLanguagePretty ?? t("player.menus.subtitles.offChoice")
          }
        >
          <div className="flex items-center gap-3">
            <LucideIcon icon={Captions} className="text-xl" />
            <span>{t("player.menus.settings.subtitleItem")}</span>
          </div>
        </Menu.ChevronLink>
        {/* {currentAudioTrack ? (
          <Menu.ChevronLink
            onClick={() => router.navigate("/audio")}
            rightText={selectedAudioLanguagePretty ?? undefined}
          >
            {t("player.menus.settings.audioItem")}
            <span className="text-type-secondary text-sm">
              {selectedAudioLanguagePretty}
            </span>
          </Menu.ChevronLink>
        ) : (
          <Menu.ChevronLink
            onClick={() => router.navigate("/audio")}
            disabled
          >
            {t("player.menus.settings.audioItem")}
            <span className="text-type-secondary text-sm">
              {t("player.menus.audio.default")}
            </span>
          </Menu.ChevronLink>
        )} */}
      </Menu.Section>
      <Menu.Section>
        {/* <Menu.Link
          clickable
          onClick={() =>
            router.navigate(downloadable ? "/download" : "/download/unable")
          }
          rightSide={<LucideIcon className="text-xl" icon={Download} />}
          className={downloadable ? "opacity-100" : "opacity-50"}
        >
          {t("player.menus.settings.downloadItem")}
        </Menu.Link> */}
        <Menu.Link
          clickable
          onClick={() =>
            router.navigate(downloadable ? "/watchparty" : "/download/unable")
          }
          rightSide={<Icon className="text-xl" icon={Icons.WATCH_PARTY} />}
          className={downloadable ? "opacity-100" : "opacity-50"}
        >
          {t("player.menus.watchparty.watchpartyItem")}
        </Menu.Link>
      </Menu.Section>
      <Menu.SectionTitle />
      <Menu.Section>
        <Menu.Link
          rightSide={
            <Toggle
              enabled={subtitlesEnabled}
              onClick={() => toggleLastUsed().catch(() => {})}
            />
          }
        >
          {t("player.menus.settings.enableSubtitles")}
        </Menu.Link>
        <Menu.ChevronLink onClick={() => router.navigate("/playback")}>
          {t("player.menus.settings.playbackItem")}
        </Menu.ChevronLink>
      </Menu.Section>
    </Menu.Card>
  );
}
