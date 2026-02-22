import classNames from "classnames";
import {
  ChevronLeft,
  Play,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAsync } from "react-use";

import { getMetaFromId } from "@/backend/metadata/getmeta";
import { MWMediaType, MWSeasonMeta } from "@/backend/metadata/types/mw";
import { LucideIcon } from "@/components/LucideIcon";
import { usePlayerMeta } from "@/components/player/hooks/usePlayerMeta";
import { useBookmarkStore } from "@/stores/bookmarks";
import { PlayerMeta } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { useProgressStore } from "@/stores/progress";
import { scrollToElement } from "@/utils/scroll";
import { useIsMobile } from "@/hooks/useIsMobile";

import { hasAired } from "../utils/aired";

// ─────────────────────────────────────────────────────────────────────────────
// Season data hook
// ─────────────────────────────────────────────────────────────────────────────

function useSeasonData(mediaId: string, seasonId: string) {
  const [seasons, setSeason] = useState<MWSeasonMeta[] | null>(null);
  const state = useAsync(async () => {
    if (!mediaId || !seasonId) return null;
    const data = await getMetaFromId(MWMediaType.SERIES, mediaId, seasonId);
    if (data?.meta.type !== MWMediaType.SERIES) return null;
    setSeason(data.meta.seasons);
    return { season: data.meta.seasonData, fullData: data };
  }, [mediaId, seasonId]);
  return [state, seasons] as const;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal helper — synchronous so no extra render/flash
// ─────────────────────────────────────────────────────────────────────────────

function getPlayerPortalElement(): Element {
  return (
    document.getElementById("vidninja-portal-mount") ||
    document.getElementById("vidninja-player-container") ||
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Close-on-mouseleave helpers (shared between button + popup)
// ─────────────────────────────────────────────────────────────────────────────

let _globalSetOpen: ((v: boolean) => void) | null = null;
let _globalCloseTimeout: ReturnType<typeof setTimeout> | null = null;

export function closeEpisodesPanel() {
  _globalSetOpen?.(false);
}

function scheduleClose(delayMs = 300) {
  if (_globalCloseTimeout) clearTimeout(_globalCloseTimeout);
  _globalCloseTimeout = setTimeout(() => {
    _globalSetOpen?.(false);
    _globalCloseTimeout = null;
  }, delayMs);
}

function cancelClose() {
  if (_globalCloseTimeout) {
    clearTimeout(_globalCloseTimeout);
    _globalCloseTimeout = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP popup – floating above bottom bar
// Image 1: season header, numbered episode rows, active ep shows thumbnail + desc
// ─────────────────────────────────────────────────────────────────────────────

function DesktopEpisodeList({
  selectedSeason,
  onChange,
  onClose,
  onBackToSeasons,
}: {
  selectedSeason: string;
  onChange?: (meta: PlayerMeta) => void;
  onClose: () => void;
  onBackToSeasons: () => void;
}) {
  const { t } = useTranslation();
  const { setPlayerMeta } = usePlayerMeta();
  const meta = usePlayerStore((s) => s.meta);
  const [loadingState] = useSeasonData(meta?.tmdbId ?? "", selectedSeason);
  const progress = useProgressStore();
  const activeRef = useRef<HTMLDivElement>(null);
  // Which row is expanded (shows thumbnail+desc)
  const [expandedId, setExpandedId] = useState<string | null>(
    meta?.episode?.tmdbId ?? null,
  );

  useEffect(() => {
    if (activeRef.current) scrollToElement(activeRef.current, { behavior: "smooth", block: "nearest" });
  }, [loadingState.value]);

  // Reset expansion when season changes
  useEffect(() => {
    setExpandedId(meta?.episode?.tmdbId ?? null);
  }, [selectedSeason, meta?.episode?.tmdbId]);

  const playEpisode = useCallback(
    (episodeId: string) => {
      onClose();
      if (loadingState.value) {
        const newData = setPlayerMeta(loadingState.value.fullData, episodeId);
        if (newData) onChange?.(newData);
      }
    },
    [setPlayerMeta, loadingState, onClose, onChange],
  );

  const seasonTitle =
    loadingState.value?.season.title ??
    t("player.menus.episodes.loadingTitle");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0">
        <button
          type="button"
          onClick={onBackToSeasons}
          className="text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-white font-bold text-lg">{seasonTitle}</h3>
      </div>

      {/* Episode list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {loadingState.loading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-7 h-7 border-2 border-white/20 rounded-full animate-spin" />
          </div>
        )}
        {loadingState.error && (
          <div className="p-6 text-center text-white/50 text-sm">
            {t("player.menus.episodes.loadingError")}
          </div>
        )}
        {loadingState.value && (
          <div>
            {loadingState.value.season.episodes.map((ep) => {
              const epProg = progress.items[meta?.tmdbId ?? ""]?.episodes?.[ep.id];
              const pct = epProg ? (epProg.progress.watched / epProg.progress.duration) * 100 : 0;
              const isActive = ep.id === meta?.episode?.tmdbId;
              const isExpanded = ep.id === expandedId;
              const isAired = hasAired(ep.air_date);

              return (
                <div
                  key={ep.id}
                  ref={isActive ? activeRef : null}
                >
                  {/* Row – click to expand/collapse */}
                  <div
                    onClick={() => {
                      if (!isAired) return;
                      setExpandedId(isExpanded ? null : ep.id);
                    }}
                    className={classNames(
                      "flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors",
                      isAired ? "hover:bg-white/5" : "opacity-40 cursor-default",
                      isExpanded && "bg-white/5",
                    )}
                  >
                    {/* Number */}
                    <span
                      className={classNames(
                        "text-lg font-semibold w-6 flex-shrink-0 tabular-nums",
                        isActive ? "text-white" : "text-white/60",
                      )}
                    >
                      {ep.number}
                    </span>

                    {/* Title */}
                    <span
                      className={classNames(
                        "flex-1 text-sm font-semibold",
                        isActive ? "text-white" : "text-white/80",
                      )}
                    >
                      {ep.title}
                    </span>

                    {/* Progress dash */}
                    <div className="flex-shrink-0 w-24 h-px bg-white/15 relative">
                      {pct > 0 && (
                        <div
                          className="absolute left-0 top-0 h-full bg-white/60"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Expanded: thumbnail + description, play button INSIDE plays it */}
                  {isExpanded && (
                    <div className="flex gap-4 px-5 py-4 bg-white/5">
                      {ep.still_path && (
                        <div
                          onClick={() => playEpisode(ep.id)}
                          className="relative w-[200px] h-[113px] flex-shrink-0 rounded-md overflow-hidden cursor-pointer group/thumb"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w400${ep.still_path}`}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay darkens on hover */}
                          <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/40 transition-colors" />
                          {/* Play button */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover/thumb:scale-110 transition-transform">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}
                      {ep.overview && (
                        <p className="text-sm text-white/70 leading-relaxed flex-1 line-clamp-4">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopSeasonList({
  seasons,
  selectedSeason,
  onSelect,
}: {
  seasons: MWSeasonMeta[];
  selectedSeason: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {seasons.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={classNames(
            "flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-white/5 first:border-t-0",
            s.id === selectedSeason ? "text-white font-semibold" : "text-white/70",
          )}
        >
          <span>{s.title}</span>
          <ChevronLeft className="w-4 h-4 rotate-180 text-white/40" />
        </button>
      ))}
    </div>
  );
}

// The actual floating popup (desktop only, shown on hover)
function DesktopEpisodesPopup({
  isOpen,
  onClose,
  onChange,
  anchorRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onChange?: (meta: PlayerMeta) => void;
  anchorRef: React.RefObject<HTMLDivElement>;
}) {
  const meta = usePlayerStore((s) => s.meta);
  const [selectedSeason, setSelectedSeason] = useState(meta?.season?.tmdbId ?? "");
  const [view, setView] = useState<"seasons" | "episodes">("episodes");
  const [, seasons] = useSeasonData(meta?.tmdbId ?? "", selectedSeason);

  useEffect(() => {
    if (isOpen) {
      setSelectedSeason(meta?.season?.tmdbId ?? "");
      setView("episodes");
    }
  }, [isOpen, meta?.season?.tmdbId]);

  return createPortal(
    <div
      className={classNames(
        "absolute bottom-[88px] right-4 z-[300] w-[480px] max-h-[70vh]",
        "flex flex-col rounded-2xl overflow-hidden",
        "bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl",
        "transition-all duration-200 ease-out origin-bottom-right",
        isOpen
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-95 pointer-events-none",
      )}
      onMouseEnter={cancelClose}
      onMouseLeave={() => scheduleClose()}
    >
      {view === "seasons" && seasons ? (
        <div className="flex flex-col h-full">
          <div className="px-5 py-4 flex-shrink-0">
            <h3 className="text-white font-bold text-lg">{meta?.title}</h3>
          </div>
          <div className="overflow-y-auto flex-1">
            <DesktopSeasonList
              seasons={seasons}
              selectedSeason={selectedSeason}
              onSelect={(id) => { setSelectedSeason(id); setView("episodes"); }}
            />
          </div>
        </div>
      ) : (
        <DesktopEpisodeList
          selectedSeason={selectedSeason}
          onChange={onChange}
          onClose={onClose}
          onBackToSeasons={() => setView("seasons")}
        />
      )}
    </div>,
    getPlayerPortalElement(),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE fullscreen overlay
// Image 2: title top-left, X top-right, season tabs, horizontal episode cards
// ─────────────────────────────────────────────────────────────────────────────

function MobileEpisodesOverlay({
  isOpen,
  onClose,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onChange?: (meta: PlayerMeta) => void;
}) {
  const meta = usePlayerStore((s) => s.meta);
  const [selectedSeason, setSelectedSeason] = useState(meta?.season?.tmdbId ?? "");
  const [, seasons] = useSeasonData(meta?.tmdbId ?? "", selectedSeason);
  const [loadingState] = useSeasonData(meta?.tmdbId ?? "", selectedSeason);
  const { setPlayerMeta } = usePlayerMeta();
  const progress = useProgressStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setSelectedSeason(meta?.season?.tmdbId ?? "");
  }, [isOpen, meta?.season?.tmdbId]);

  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [loadingState.value]);

  const playEpisode = useCallback(
    (episodeId: string) => {
      onClose();
      if (loadingState.value) {
        const newData = setPlayerMeta(loadingState.value.fullData, episodeId);
        if (newData) onChange?.(newData);
      }
    },
    [setPlayerMeta, loadingState, onClose, onChange],
  );

  return createPortal(
    <div
      className={classNames(
        "absolute inset-0 z-[300] flex flex-col",
        "bg-black/90 backdrop-blur-2xl",
        "transition-all duration-250 ease-out",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
        <h2 className="text-white font-bold text-lg line-clamp-1 flex-1 mr-4">
          {meta?.title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Season tabs */}
      {seasons && seasons.length > 0 && (
        <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-none flex-shrink-0">
          {seasons.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSeason(s.id)}
              className={classNames(
                "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0",
                s.id === selectedSeason
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/80 hover:bg-white/20",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Horizontal episode scroll */}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        {loadingState.loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 rounded-full animate-spin" />
          </div>
        )}

        {loadingState.value && (
          <div
            ref={scrollRef}
            className="flex gap-4 px-5 overflow-x-auto pb-4 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {loadingState.value.season.episodes.map((ep) => {
              const epProg = progress.items[meta?.tmdbId ?? ""]?.episodes?.[ep.id];
              const pct = epProg ? (epProg.progress.watched / epProg.progress.duration) * 100 : 0;
              const isActive = ep.id === meta?.episode?.tmdbId;
              const isAired = hasAired(ep.air_date);
              // Duration from episode runtime (minutes)
              const duration = ep.runtime ? `${ep.runtime}m` : null;

              return (
                <div
                  key={ep.id}
                  ref={isActive ? activeCardRef : null}
                  className="flex-shrink-0 w-[240px] flex flex-col gap-2"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => isAired && playEpisode(ep.id)}
                    className={classNames(
                      "relative aspect-video rounded-xl overflow-hidden cursor-pointer",
                      isAired ? "transition-all" : "opacity-40 cursor-default",
                      isActive ? "" : "",
                    )}
                  >
                    {ep.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w400${ep.still_path}`}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10" />
                    )}

                    {/* Play circle */}
                    {isAired && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/50 border-2 border-white/80 flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    {pct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Episode info row */}
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">
                      {ep.number}. {ep.title}
                    </span>
                  </div>

                  {/* Duration */}
                  {duration && (
                    <span className="text-white/50 text-xs -mt-1">{duration}</span>
                  )}

                  {/* Description */}
                  {ep.overview && (
                    <p className="text-white/60 text-xs leading-relaxed line-clamp-4">
                      {ep.overview}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    getPlayerPortalElement(),
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Public exports
// ─────────────────────────────────────────────────────────────────────────────


interface EpisodesProps {
  onChange?: (meta: PlayerMeta) => void;
}

export function EpisodesRouter(props: EpisodesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);

  useEffect(() => {
    _globalSetOpen = setIsOpen;
    return () => { _globalSetOpen = null; };
  }, []);

  useEffect(() => {
    setHasOpenOverlay(isOpen);
  }, [isOpen, setHasOpenOverlay]);

  const { isMobile } = useIsMobile();
  const anchorRef = useRef<HTMLDivElement>(null);

  return isMobile ? (
    <MobileEpisodesOverlay
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onChange={props.onChange}
    />
  ) : (
    <DesktopEpisodesPopup
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onChange={props.onChange}
      anchorRef={anchorRef}
    />
  );
}

function EpisodesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 5h14v8h2V5a2 2 0 0 0-2-2H8zm10 4H4V7h14a2 2 0 0 1 2 2v8h-2zM0 13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm14 6v-6H2v6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Episodes(props: {
  inControl: boolean;
  iconSizeClass?: string;
}) {
  const type = usePlayerStore((s) => s.meta?.type);
  const { t } = useTranslation();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openPanel = useCallback(() => {
    cancelClose();
    _globalSetOpen?.(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    // Only hover-open on desktop
    if (window.innerWidth >= 1024) {
      cancelClose();
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        _globalSetOpen?.(true);
      }, 120);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Cancel pending open, then schedule close on desktop
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (window.innerWidth >= 1024) scheduleClose();
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  if (type !== "show" || !props.inControl) return null;

  return (
    <div className="relative inline-flex">
      <button
        onClick={openPanel}            // click on mobile
        onMouseEnter={handleMouseEnter} // hover on desktop
        onMouseLeave={handleMouseLeave}
        className="text-white hover:text-white/80 transition-colors flex items-center justify-center rounded-lg p-2"
        title={t("player.menus.episodes.button")}
      >
        <EpisodesIcon className={props.iconSizeClass || "w-8 h-8"} />
        <span className="sr-only">{t("player.menus.episodes.button")}</span>
      </button>
    </div>
  );
}
