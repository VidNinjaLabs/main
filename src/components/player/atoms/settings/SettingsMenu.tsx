import { AudioLines, Captions, Server, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getCachedMetadata } from "@/backend/api/metadata";
import { Toggle } from "@/components/buttons/Toggle";
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
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const audioTracks = usePlayerStore((s) => s.audioTracks);
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

  const availableStreams = usePlayerStore((s) => s.availableStreams);
  const currentStreamIndex = usePlayerStore((s) => s.currentStreamIndex);

  const selectedLanguagePretty = selectedCaptionLanguage
    ? (getPrettyLanguageNameFromLocale(selectedCaptionLanguage) ??
      t("player.menus.subtitles.unknownLanguage"))
    : undefined;

  let selectedAudioLanguagePretty;
  if (availableStreams && availableStreams.length > 1) {
    const stream = availableStreams[currentStreamIndex];
    selectedAudioLanguagePretty =
      stream?.label?.match(/\(([^)]+)\)$/)?.[1] ??
      stream?.label ??
      stream?.quality ??
      `Stream ${currentStreamIndex + 1}`;
  } else if (currentAudioTrack) {
    selectedAudioLanguagePretty =
      getPrettyLanguageNameFromLocale(currentAudioTrack.language) ??
      currentAudioTrack.label;
  }

  const showAudioMenu =
    (availableStreams && availableStreams.length > 1) ||
    (audioTracks && audioTracks.length > 1);

  return (
    <Menu.Card>
      <Menu.Section>
        <Menu.ChevronLink
          onClick={() => router.navigate("/quality")}
          rightText={currentQuality ? qualityToString(currentQuality) : "Auto"}
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
        {showAudioMenu ? (
          <Menu.ChevronLink
            onClick={() => router.navigate("/audio")}
            rightText={selectedAudioLanguagePretty ?? undefined}
          >
            <div className="flex items-center gap-3">
              <LucideIcon icon={AudioLines} className="text-xl" />
              <span>{t("player.menus.settings.audioItem")}</span>
            </div>
          </Menu.ChevronLink>
        ) : null}
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
