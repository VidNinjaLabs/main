/* eslint-disable @typescript-eslint/no-unused-vars */
import classNames from "classnames";
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Server,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCachedMetadata } from "@/backend/api/metadata";
import { updateSettings } from "@/backend/accounts/settings";
import { Toggle } from "@/components/buttons/Toggle";
import { LucideIcon } from "@/components/LucideIcon";
import { useCaptions } from "@/components/player/hooks/useCaptions";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { useAuthStore } from "@/stores/auth";
import { usePlayerStore } from "@/stores/player/store";
import { qualityToString } from "@/stores/player/utils/qualities";
import { usePreferencesStore } from "@/stores/preferences";
import { useSubtitleStore } from "@/stores/subtitles";
import { getPrettyLanguageNameFromLocale } from "@/utils/language";
import { isAutoplayAllowed } from "@/utils/autoplay";

// Speed Button List Component
function SpeedButtonList(props: {
  options: number[];
  selected: number;
  onClick: (v: number) => void;
  disabled?: boolean;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState<string>("");
  const [isCustomSpeed, setIsCustomSpeed] = useState(false);

  useEffect(() => {
    if (!props.options.includes(props.selected)) {
      setIsCustomSpeed(true);
    } else {
      setIsCustomSpeed(false);
    }
  }, [props.selected, props.options]);

  const handleButtonClick = useCallback(
    (option: number, index: number) => {
      if (editingIndex === index) return;
      if (isCustomSpeed && option === props.selected) {
        setEditingIndex(0);
        setCustomValue(option.toString());
        return;
      }
      props.onClick(option);
      setIsCustomSpeed(false);
    },
    [editingIndex, props, isCustomSpeed],
  );

  const handleDoubleClick = useCallback(
    (option: number, index: number) => {
      if (props.disabled) return;
      setEditingIndex(index);
      setCustomValue(option.toString());
    },
    [props.disabled],
  );

  const handleCustomValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomValue(e.target.value);
    },
    [],
  );

  const handleCustomValueKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const value = parseFloat(customValue);
        if (!Number.isNaN(value) && value > 0 && value <= 5) {
          props.onClick(value);
          setEditingIndex(null);
          setIsCustomSpeed(true);
        }
      } else if (e.key === "Escape") {
        setEditingIndex(null);
      }
    },
    [customValue, props],
  );

  const handleInputBlur = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const handleResetCustomSpeed = useCallback(() => {
    setIsCustomSpeed(false);
    props.onClick(1);
  }, [props]);

  return (
    <div className="flex items-center bg-white/5 p-1 rounded-lg gap-0.5">
      {isCustomSpeed ? (
        <button
          type="button"
          disabled={props.disabled}
          className={classNames(
            "w-full px-2 py-1.5 rounded-md text-sm relative",
            "bg-white/20 text-white",
            props.disabled ? "opacity-50 cursor-not-allowed" : null,
          )}
          onClick={() => handleButtonClick(props.selected, 0)}
          onDoubleClick={() => handleDoubleClick(props.selected, 0)}
          key="custom"
        >
          {editingIndex === 0 ? (
            <input
              type="text"
              value={customValue}
              onChange={handleCustomValueChange}
              onKeyDown={handleCustomValueKeyDown}
              onBlur={handleInputBlur}
              className="w-full bg-transparent text-center focus:outline-none"
              autoFocus
              aria-label="Custom playback speed"
            />
          ) : (
            <>
              {`${props.selected}x`}
              <button
                type="button"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                onClick={handleResetCustomSpeed}
                title="Reset to presets"
              >
                <LucideIcon icon={X} className="w-3 h-3" />
              </button>
            </>
          )}
        </button>
      ) : (
        props.options.map((option, index) => {
          const isEditing = editingIndex === index;
          return (
            <button
              type="button"
              disabled={props.disabled}
              className={classNames(
                "flex-1 px-2 py-1.5 rounded-md text-xs relative transition-colors",
                props.selected === option
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10",
                props.disabled ? "opacity-50 cursor-not-allowed" : null,
              )}
              onClick={() => handleButtonClick(option, index)}
              onDoubleClick={() => handleDoubleClick(option, index)}
              key={option}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={customValue}
                  onChange={handleCustomValueChange}
                  onKeyDown={handleCustomValueKeyDown}
                  onBlur={handleInputBlur}
                  className="w-full bg-transparent text-center focus:outline-none"
                  autoFocus
                  aria-label="Custom playback speed"
                />
              ) : (
                `${option}x`
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

type ViewType = "main" | "playback" | "quality" | "audio";

export function SettingsMenu({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const [view, setView] = useState<ViewType>("main");

  // Store selectors
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const selectedCaptionLanguage = usePlayerStore(
    (s) => s.caption.selected?.language,
  );
  const subtitlesEnabled = useSubtitleStore((s) => s.enabled);
  const currentSourceId = usePlayerStore((s) => s.sourceId);
  const providerNames = usePreferencesStore((s) => s.providerNames);
  const playbackRate = usePlayerStore((s) => s.mediaPlaying.playbackRate);
  const display = usePlayerStore((s) => s.display);
  const enableThumbnails = usePreferencesStore((s) => s.enableThumbnails);
  const setEnableThumbnails = usePreferencesStore((s) => s.setEnableThumbnails);
  const enableAutoplay = usePreferencesStore((s) => s.enableAutoplay);
  const setEnableAutoplay = usePreferencesStore((s) => s.setEnableAutoplay);
  const enableLowPerformanceMode = usePreferencesStore(
    (s) => s.enableLowPerformanceMode,
  );
  const qualities = usePlayerStore((s) => s.qualities);
  const switchQuality = usePlayerStore((s) => s.switchQuality);
  const availableStreams = usePlayerStore((s) => s.availableStreams);
  const currentStreamIndex = usePlayerStore((s) => s.currentStreamIndex);
  const switchStream = usePlayerStore((s) => s.switchStream);

  const account = useAuthStore((s) => s.account);
  const backendUrl = useBackendUrl();
  const allowAutoplay = useMemo(() => isAutoplayAllowed(), []);
  const canShowAutoplay = allowAutoplay && !enableLowPerformanceMode;

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

  // Playback handlers
  const speedOptions = [0.25, 0.5, 1, 1.5, 2];

  const setPlaybackRate = useCallback(
    (v: number) => {
      display?.setPlaybackRate(v);
    },
    [display],
  );

  const saveThumbnailSetting = useCallback(
    async (value: boolean) => {
      if (!account || !backendUrl) return;
      try {
        await updateSettings(backendUrl, account, { enableThumbnails: value });
      } catch (error) {
        console.error("Failed to save thumbnail setting:", error);
      }
    },
    [account, backendUrl],
  );

  const saveAutoplaySetting = useCallback(
    async (value: boolean) => {
      if (!account || !backendUrl) return;
      try {
        await updateSettings(backendUrl, account, { enableAutoplay: value });
      } catch (error) {
        console.error("Failed to save autoplay setting:", error);
      }
    },
    [account, backendUrl],
  );

  const handleThumbnailToggle = useCallback(() => {
    const newValue = !enableThumbnails;
    setEnableThumbnails(newValue);
    saveThumbnailSetting(newValue);
  }, [enableThumbnails, setEnableThumbnails, saveThumbnailSetting]);

  const handleAutoplayToggle = useCallback(() => {
    const newValue = !enableAutoplay;
    setEnableAutoplay(newValue);
    saveAutoplaySetting(newValue);
  }, [enableAutoplay, setEnableAutoplay, saveAutoplaySetting]);

  // Quality handler
  const handleQualitySelect = useCallback(
    (quality: any) => {
      if (switchQuality) {
        switchQuality(quality);
      }
    },
    [switchQuality],
  );

  // Audio handler
  const handleAudioSelect = useCallback(
    (index: number) => {
      if (switchStream) {
        switchStream(index);
      }
    },
    [switchStream],
  );

  const handleAudioTrackSelect = useCallback(
    (trackId: string) => {
      if (display) {
        display.setAudioTrack(trackId);
      }
    },
    [display],
  );

  // Main View
  if (view === "main") {
    return (
      <Menu.Card>
        <Menu.Title>Settings</Menu.Title>
        <Menu.Section>
          <Menu.ChevronLink
            onClick={() => setView("quality")}
            rightText={
              currentQuality ? qualityToString(currentQuality) : "Auto"
            }
          >
            <div className="flex items-center gap-3">
              <LucideIcon icon={SlidersHorizontal} className="w-4 h-4" />
              <span>{t("player.menus.settings.qualityItem")}</span>
            </div>
          </Menu.ChevronLink>
          <Menu.ChevronLink
            onClick={() => router.navigate("/source")}
            rightText={sourceName}
          >
            <div className="flex items-center gap-3">
              <LucideIcon icon={Server} className="w-4 h-4" />
              <span>{t("player.menus.settings.sourceItem")}</span>
            </div>
          </Menu.ChevronLink>

          {showAudioMenu ? (
            <Menu.ChevronLink
              onClick={() => setView("audio")}
              rightText={selectedAudioLanguagePretty ?? undefined}
            >
              <div className="flex items-center gap-3">
                <LucideIcon icon={AudioLines} className="w-4 h-4" />
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
          <Menu.ChevronLink onClick={() => setView("playback")}>
            {t("player.menus.settings.playbackItem")}
          </Menu.ChevronLink>
        </Menu.Section>
      </Menu.Card>
    );
  }

  // Playback Settings View (inline)
  if (view === "playback") {
    return (
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
          <button
            onClick={() => setView("main")}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <h3 className="text-white/70 font-medium text-xs uppercase tracking-wider">
            {t("player.menus.playback.title")}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Speed Control */}
          <div>
            <div className="text-white/70 text-xs uppercase tracking-wider mb-2">
              {t("player.menus.playback.speedLabel")}
            </div>
            <SpeedButtonList
              options={speedOptions}
              selected={playbackRate}
              onClick={setPlaybackRate}
            />
          </div>

          {/* Autoplay Toggle */}
          {canShowAutoplay && (
            <div className="flex items-center justify-between py-1">
              <span className="text-white/90 text-sm">
                {t("settings.preferences.autoplayLabel")}
              </span>
              <Toggle enabled={enableAutoplay} onClick={handleAutoplayToggle} />
            </div>
          )}

          {/* Thumbnails Toggle */}
          {!enableLowPerformanceMode && (
            <div className="flex items-center justify-between py-1">
              <span className="text-white/90 text-sm">
                {t("settings.preferences.thumbnailLabel")}
              </span>
              <Toggle
                enabled={enableThumbnails}
                onClick={handleThumbnailToggle}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quality Settings View (inline)
  if (view === "quality") {
    return (
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
          <button
            onClick={() => setView("main")}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <h3 className="text-white/70 font-medium text-xs uppercase tracking-wider">
            {t("player.menus.settings.qualityItem")}
          </h3>
        </div>

        <div className="py-1.5">
          {qualities.map((quality: any) => (
            <button
              key={quality}
              onClick={() => handleQualitySelect(quality)}
              className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              {currentQuality === quality ? (
                <div className="w-4 h-4 rounded-full bg-white flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/40 flex-shrink-0" />
              )}
              <span className="text-white/90 text-sm">
                {qualityToString(quality)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Audio Settings View (inline)
  if (view === "audio") {
    const hasStreams = availableStreams && availableStreams.length > 1;
    const hasTracks = audioTracks && audioTracks.length > 1;

    return (
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
          <button
            onClick={() => setView("main")}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <h3 className="text-white/70 font-medium text-xs uppercase tracking-wider">
            {t("player.menus.settings.audioItem")}
          </h3>
        </div>

        <div className="py-1.5">
          {hasStreams &&
            availableStreams.map((stream, index) => (
              <button
                key={index}
                onClick={() => handleAudioSelect(index)}
                className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                {currentStreamIndex === index ? (
                  <div className="w-4 h-4 rounded-full bg-white flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/40 flex-shrink-0" />
                )}
                <span className="text-white/90 text-sm truncate">
                  {stream.label || stream.quality || `Stream ${index + 1}`}
                </span>
              </button>
            ))}

          {hasTracks &&
            !hasStreams &&
            audioTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => handleAudioTrackSelect(track.id)}
                className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                {currentAudioTrack?.id === track.id ? (
                  <div className="w-4 h-4 rounded-full bg-white flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/40 flex-shrink-0" />
                )}
                <span className="text-white/90 text-sm truncate">
                  {track.label ||
                    getPrettyLanguageNameFromLocale(track.language) ||
                    `Track ${track.id}`}
                </span>
              </button>
            ))}
        </div>
      </div>
    );
  }

  return null;
}
