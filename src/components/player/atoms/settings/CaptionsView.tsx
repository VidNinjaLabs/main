/* eslint-disable react/no-unused-prop-types */
import classNames from "classnames";
import Fuse from "fuse.js";
import { Clipboard as ClipboardIcon, Ear, Upload } from "lucide-react";
import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncFn } from "react-use";
import { convert } from "subsrt-ts";

import { subtitleTypeList } from "@/backend/helpers/subs";
import { FileDropHandler } from "@/components/DropFile";
import { LucideIcon } from "@/components/LucideIcon";
import { useCaptions } from "@/components/player/hooks/useCaptions";
import { Menu } from "@/components/player/internals/ContextMenu";
import { SelectableLink } from "@/components/player/internals/ContextMenu/Links";
import {
  captionIsVisible,
  parseSubtitles,
} from "@/components/player/utils/captions";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { CaptionListItem } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { useSubtitleStore } from "@/stores/subtitles";
import {
  getPrettyLanguageNameFromLocale,
  sortLangCodes,
} from "@/utils/language";

export function CaptionOption(props: {
  children: React.ReactNode;
  selected?: boolean;
  loading?: boolean;
  onClick?: () => void;
  error?: React.ReactNode;
  flag?: boolean;
  subtitleUrl?: string;
  subtitleType?: string;
  // subtitle details from wyzie
  subtitleSource?: string;
  subtitleEncoding?: string;
  isHearingImpaired?: boolean;
  onDoubleClick?: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

  const tooltipContent = useMemo(() => {
    if (!props.subtitleUrl && !props.subtitleSource) return null;

    const parts = [];

    if (props.subtitleSource) {
      parts.push(`Source: ${props.subtitleSource}`);
    }

    if (props.subtitleEncoding) {
      parts.push(`Encoding: ${props.subtitleEncoding}`);
    }

    if (props.isHearingImpaired) {
      parts.push(`Hearing Impaired: Yes`);
    }

    if (props.subtitleUrl) {
      parts.push(`URL: ${props.subtitleUrl}`);
    }

    return parts.join("\n");
  }, [
    props.subtitleUrl,
    props.subtitleSource,
    props.subtitleEncoding,
    props.isHearingImpaired,
  ]);

  const handleMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(true), 500);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowTooltip(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SelectableLink
        selected={props.selected}
        loading={props.loading}
        error={props.error}
        onClick={props.onClick}
        onDoubleClick={props.onDoubleClick}
      >
        <span
          data-active-link={props.selected ? true : undefined}
          className="flex items-center"
        >
          <span>{props.children}</span>
          {props.isHearingImpaired && (
            <LucideIcon icon={Ear} className="ml-2" />
          )}
        </span>
      </SelectableLink>
      {tooltipContent && showTooltip && (
        <div className="flex flex-col absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-black/80 text-white/80 text-xs rounded-lg backdrop-blur-sm w-60 break-all whitespace-pre-line">
          {tooltipContent}
          {props.onDoubleClick && (
            <span className="text-white/50 text-xs">
              {t("player.menus.subtitles.doubleClickToCopy")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Hook to filter and sort subtitle list with search
export function useSubtitleList(subs: CaptionListItem[], searchQuery: string) {
  const { t: translate } = useTranslation();
  const unknownChoice = translate("player.menus.subtitles.unknownLanguage");
  return useMemo(() => {
    const input = subs.map((t) => ({
      ...t,
      languageName:
        getPrettyLanguageNameFromLocale(t.language) ?? unknownChoice,
    }));
    const sorted = sortLangCodes(input.map((t) => t.language));
    let results = input.sort((a, b) => {
      return sorted.indexOf(a.language) - sorted.indexOf(b.language);
    });

    if (searchQuery.trim().length > 0) {
      const fuse = new Fuse(input, {
        includeScore: true,
        threshold: 0.3, // Lower threshold = stricter matching (0 = exact, 1 = match anything)
        keys: ["languageName"],
      });

      results = fuse.search(searchQuery).map((res) => res.item);
    }

    return results;
  }, [subs, searchQuery, unknownChoice]);
}

export function CustomCaptionOption({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const lang = usePlayerStore((s) => s.caption.selected?.language);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setCustomSubs = useSubtitleStore((s) => s.setCustomSubs);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleClick = () => fileInput.current?.click();

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex-1 flex w-full items-center justify-center gap-2 p-1.5 rounded-lg bg-video-context-type-accent hover:bg-opacity-80 transition-colors text-white font-medium"
      >
        <LucideIcon icon={Upload} className="text-lg" />
        <span>{t("player.menus.subtitles.customChoice")}</span>
        <input
          className="hidden"
          ref={fileInput}
          accept={subtitleTypeList.join(",")}
          type="file"
          onChange={(e) => {
            if (!e.target.files) return;
            const reader = new FileReader();
            reader.addEventListener("load", (event) => {
              if (!event.target || typeof event.target.result !== "string")
                return;
              const converted = convert(event.target.result, "srt");
              setCaption({
                language: "custom",
                srtData: converted,
                id: "custom-caption",
              });
              setCustomSubs();
            });
            reader.readAsText(e.target.files[0], "utf-8");
          }}
        />
      </button>
    );
  }

  return (
    <CaptionOption selected={lang === "custom"} onClick={handleClick}>
      {t("player.menus.subtitles.customChoice")}
      <input
        className="hidden"
        ref={fileInput}
        accept={subtitleTypeList.join(",")}
        type="file"
        onChange={(e) => {
          if (!e.target.files) return;
          const reader = new FileReader();
          reader.addEventListener("load", (event) => {
            if (!event.target || typeof event.target.result !== "string")
              return;
            const converted = convert(event.target.result, "srt");
            setCaption({
              language: "custom",
              srtData: converted,
              id: "custom-caption",
            });
            setCustomSubs();
          });
          reader.readAsText(e.target.files[0], "utf-8");
        }}
      />
    </CaptionOption>
  );
}

export function PasteCaptionOption(props: {
  selected?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setCustomSubs = useSubtitleStore((s) => s.setCustomSubs);
  const setDelay = useSubtitleStore((s) => s.setDelay);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedData = JSON.parse(clipboardText);

      // Validate the structure
      if (!parsedData.id || !parsedData.url || !parsedData.language) {
        throw new Error("Invalid subtitle data format");
      }

      // Check for CORS restrictions
      if (parsedData.hasCorsRestrictions) {
        throw new Error("Protected subtitle url, cannot be used");
      }

      // Fetch the subtitle content
      const response = await fetch(parsedData.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch subtitle: ${response.status}`);
      }

      const subtitleText = await response.text();

      // Convert to SRT format
      const converted = convert(subtitleText, "srt");

      setCaption({
        language: parsedData.language,
        srtData: converted,
        id: "pasted-caption",
      });
      setCustomSubs();

      // Set delay if included in the pasted data, otherwise reset to 0
      if (parsedData.delay !== undefined) {
        setDelay(parsedData.delay);
      } else {
        setDelay(0);
      }
    } catch (err) {
      console.error("Failed to paste subtitle:", err);
      setError(err instanceof Error ? err.message : "Failed to paste subtitle");
    } finally {
      setIsLoading(false);
    }
  };

  if (props.compact) {
    return (
      <button
        type="button"
        onClick={handlePaste}
        className={classNames(
          "flex-1 flex items-center justify-center gap-2 p-1.5 rounded-lg transition-colors text-white font-medium",
          props.selected
            ? "bg-video-context-type-accent"
            : "bg-video-context-light bg-opacity-20 hover:bg-opacity-30",
        )}
      >
        <LucideIcon icon={ClipboardIcon} className="text-lg" />
        <span>{t("player.menus.subtitles.pasteChoice")}</span>
      </button>
    );
  }

  return (
    <CaptionOption
      onClick={handlePaste}
      loading={isLoading}
      error={error}
      selected={props.selected}
    >
      {t("player.menus.subtitles.pasteChoice")}
    </CaptionOption>
  );
}

export function CaptionsView({
  id,
  backLink,
}: {
  id: string;
  backLink?: true;
}) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const selectedCaptionId = usePlayerStore((s) => s.caption.selected?.id);
  const { selectCaptionById } = useCaptions();
  const [dragging, setDragging] = useState(false);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const [currentlyDownloading, setCurrentlyDownloading] = useState<
    string | null
  >(null);
  const videoTime = usePlayerStore((s) => s.progress.time);
  const srtData = usePlayerStore((s) => s.caption.selected?.srtData);
  const language = usePlayerStore((s) => s.caption.selected?.language);
  const captionList = usePlayerStore((s) => s.captionList);
  const getHlsCaptionList = usePlayerStore((s) => s.display?.getCaptionList);
  const isLoadingExternalSubtitles = usePlayerStore(
    (s) => s.isLoadingExternalSubtitles,
  );
  const delay = useSubtitleStore((s) => s.delay);

  // Get combined caption list
  const captions = useMemo(
    () =>
      captionList.length !== 0 ? captionList : (getHlsCaptionList?.() ?? []),
    [captionList, getHlsCaptionList],
  );

  // Split captions into source and external (opensubtitles)
  const sourceCaptions = useMemo(
    () => captions.filter((x) => !x.opensubtitles),
    [captions],
  );
  const externalCaptions = useMemo(
    () => captions.filter((x) => x.opensubtitles),
    [captions],
  );

  // Filter lists based on search query (search removed, using empty string)
  const sourceList = useSubtitleList(sourceCaptions, "");
  const externalList = useSubtitleList(externalCaptions, "");

  // Get current subtitle text preview
  const currentSubtitleText = useMemo(() => {
    if (!srtData || !selectedCaptionId) return null;
    const parsedCaptions = parseSubtitles(srtData, language);
    const visibleCaption = parsedCaptions.find(({ start, end }) =>
      captionIsVisible(start, end, delay, videoTime),
    );
    return visibleCaption?.content;
  }, [srtData, language, delay, videoTime, selectedCaptionId]);

  // Download handler
  const [downloadReq, startDownload] = useAsyncFn(
    async (captionId: string) => {
      setCurrentlyDownloading(captionId);
      return selectCaptionById(captionId);
    },
    [selectCaptionById, setCurrentlyDownloading],
  );

  function onDrop(event: DragEvent<HTMLDivElement>) {
    const files = event.dataTransfer.files;
    const firstFile = files[0];
    if (!files || !firstFile) return;

    const fileExtension = `.${firstFile.name.split(".").pop()}`;
    if (!fileExtension || !subtitleTypeList.includes(fileExtension)) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", (e) => {
      if (!e.target || typeof e.target.result !== "string") return;

      const converted = convert(e.target.result, "srt");

      setCaption({
        language: "custom",
        srtData: converted,
        id: "custom-caption",
      });
    });

    reader.readAsText(firstFile);
  }

  // Render subtitle option
  const renderSubtitleOption = (
    v: CaptionListItem & { languageName: string },
  ) => {
    const handleDoubleClick = async () => {
      const copyData = {
        id: v.id,
        url: v.url,
        language: v.language,
        type: v.type,
        hasCorsRestrictions: v.needsProxy,
        opensubtitles: v.opensubtitles,
        display: v.display,
        media: v.media,
        isHearingImpaired: v.isHearingImpaired,
        source: v.source,
        encoding: v.encoding,
        delay,
      };

      try {
        await navigator.clipboard.writeText(JSON.stringify(copyData));
        // Could add a toast notification here if needed
      } catch (err) {
        console.error("Failed to copy subtitle data:", err);
      }
    };

    return (
      <CaptionOption
        key={v.id}
        selected={v.id === selectedCaptionId}
        loading={v.id === currentlyDownloading && downloadReq.loading}
        error={
          v.id === currentlyDownloading && downloadReq.error
            ? downloadReq.error.toString()
            : undefined
        }
        onClick={() => startDownload(v.id)}
        onDoubleClick={handleDoubleClick}
        flag
        subtitleUrl={v.url}
        subtitleType={v.type}
        subtitleSource={v.source}
        subtitleEncoding={v.encoding}
        isHearingImpaired={v.isHearingImpaired}
      >
        {v.languageName}
      </CaptionOption>
    );
  };

  return (
    <>
      <div>
        <div
          className={classNames(
            "absolute inset-0 flex items-center justify-center text-white z-10 pointer-events-none transition-opacity duration-300",
            dragging ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="flex flex-col items-center">
            <LucideIcon className="text-5xl mb-4" icon={Upload} />
            <span className="text-xl weight font-medium">
              {t("player.menus.subtitles.dropSubtitleFile")}
            </span>
          </div>
        </div>
      </div>
      <FileDropHandler
        className={`transition duration-300 ${dragging ? "opacity-20" : ""}`}
        onDraggingChange={(isDragging) => {
          setDragging(isDragging);
        }}
        onDrop={(event) => onDrop(event)}
      >
        {/* Current subtitle preview */}
        {selectedCaptionId && (
          <div className="mt-3 p-2 rounded-xl bg-video-context-light bg-opacity-10 text-center sm:hidden">
            <div className="text-sm text-video-context-type-secondary mb-1">
              {t("player.menus.subtitles.previewLabel")}
            </div>
            <div
              className="text-base font-medium min-h-[3rem] flex items-center justify-center"
              style={{ minHeight: "3rem" }}
            >
              {currentSubtitleText ? (
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: currentSubtitleText.replaceAll(/\r?\n/g, "<br />"),
                  }}
                />
              ) : (
                <span className="text-video-context-type-secondary italic">
                  ...{" "}
                </span>
              )}
            </div>
          </div>
        )}

        <Menu.ScrollToActiveSection className="">
          <div className="space-y-2">
            {/* Custom upload option */}
            <CustomCaptionOption compact />

            {/* Customize button */}
            <button
              type="button"
              onClick={() =>
                router.navigate(
                  backLink ? "/captions/settings" : "/captions/settingsOverlay",
                )
              }
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-video-context-light bg-opacity-20 hover:bg-opacity-30 transition-colors text-white font-medium"
            >
              <span>{t("player.menus.subtitles.customizeLabel")}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-video-context-border opacity-30" />

          {/* No subtitles available message */}
          {!isLoadingExternalSubtitles &&
            sourceCaptions.length === 0 &&
            externalCaptions.length === 0 && (
              <div className="p-4 rounded-xl bg-video-context-light bg-opacity-10 text-center">
                <div className="text-video-context-type-secondary">
                  {t("player.menus.subtitles.empty")}
                </div>
              </div>
            )}

          {/* Loading external subtitles */}
          {isLoadingExternalSubtitles && externalCaptions.length === 0 && (
            <div className="p-4 rounded-xl bg-video-context-light bg-opacity-10 text-center">
              <div className="text-video-context-type-secondary">
                {t("player.menus.subtitles.loadingExternal")}
              </div>
            </div>
          )}

          {/* All Subtitles - No sections, just a clean list */}
          {sourceList.length > 0 && sourceList.map(renderSubtitleOption)}
          {externalList.length > 0 && externalList.map(renderSubtitleOption)}
        </Menu.ScrollToActiveSection>
      </FileDropHandler>
    </>
  );
}

export default CaptionsView;
