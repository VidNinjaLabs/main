import { iso6393To1 } from "iso-639-3";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { FlagIcon } from "@/components/FlagIcon";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { AudioTrack } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { getPrettyLanguageNameFromLocale } from "@/utils/language";

import { SelectableLink } from "../../internals/ContextMenu/Links";

export function AudioOption(props: {
  langCode?: string;
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <SelectableLink selected={props.selected} onClick={props.onClick}>
      <span className="flex items-center">
        <span data-code={props.langCode} className="mr-3 inline-flex">
          <FlagIcon langCode={props.langCode} />
        </span>
        <span>{props.children}</span>
      </span>
    </SelectableLink>
  );
}

export function AudioView({ id }: { id: string }) {
  const { t } = useTranslation();
  const unknownChoice = t("player.menus.subtitles.unknownLanguage");

  const router = useOverlayRouter(id);
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const changeAudioTrack = usePlayerStore((s) => s.display?.changeAudioTrack);

  const availableStreams = usePlayerStore((s) => s.availableStreams);
  const currentStreamIndex = usePlayerStore((s) => s.currentStreamIndex);
  const switchStream = usePlayerStore((s) => s.switchStream);

  const hasMultipleStreams = availableStreams && availableStreams.length > 1;

  const change = useCallback(
    (track: AudioTrack) => {
      changeAudioTrack?.(track);
      router.close();
    },
    [router, changeAudioTrack],
  );

  const handleStreamSwitch = useCallback(
    (index: number) => {
      switchStream(index);
      router.close();
    },
    [router, switchStream],
  );

  if (hasMultipleStreams) {
    return (
      <>
        <Menu.BackLink onClick={() => router.navigate("/")}>
          Audio
        </Menu.BackLink>
        <Menu.Section className="flex flex-col pb-4">
          {availableStreams.map((stream, index) => (
            <AudioOption
              key={stream.id || `stream-${index}`}
              selected={index === currentStreamIndex}
              langCode={stream.language || "en"}
              onClick={() => handleStreamSwitch(index)}
            >
              {stream.label?.match(/\(([^)]+)\)$/)?.[1] ??
                stream.label ??
                stream.quality ??
                `Stream ${index + 1}`}
            </AudioOption>
          ))}
        </Menu.Section>
      </>
    );
  }

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>Audio</Menu.BackLink>
      <Menu.Section className="flex flex-col pb-4">
        {audioTracks.map((v) => (
          <AudioOption
            key={v.id}
            selected={v.id === currentAudioTrack?.id}
            langCode={
              v.language.length === 3
                ? (iso6393To1[v.language] ?? v.language)
                : v.language
            }
            onClick={audioTracks.includes(v) ? () => change(v) : undefined}
          >
            {getPrettyLanguageNameFromLocale(v.language) ??
              v.label ??
              unknownChoice}
          </AudioOption>
        ))}
      </Menu.Section>
    </>
  );
}
