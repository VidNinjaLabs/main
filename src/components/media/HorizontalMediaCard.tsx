import classNames from "classnames";
import { Edit, Ellipsis, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { mediaItemToId } from "@/backend/metadata/tmdb";
import { DotList } from "@/components/text/DotList";
import { Flare } from "@/components/utils/Flare";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { usePreferencesStore } from "@/stores/preferences";
import { MediaItem } from "@/utils/mediaTypes";
import { getMediaBackdrop, getMediaBackdropEn } from "@/backend/metadata/tmdb";

import { IconPatch } from "../buttons/IconPatch";
import { LucideIcon } from "../LucideIcon";
import { MediaBookmarkButton } from "./MediaBookmark";

// Intersection Observer Hook
function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      {
        ...options,
        rootMargin: options.rootMargin || "300px 0px",
      },
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [options]);

  return { targetRef, isIntersecting, hasIntersected };
}

// Skeleton Component for Horizontal Card
function HorizontalMediaCardSkeleton() {
  return (
    <div className="group -m-[0.705em] rounded-xl bg-background-main transition-colors duration-300">
      <div className="pointer-events-auto relative mb-2 p-[0.4em] transition-transform duration-300">
        <div className="animate-pulse">
          {/* Backdrop skeleton - 16:9 aspect ratio */}
          <div className="relative mb-2 pb-[56.25%] w-full overflow-hidden rounded-xl bg-mediaCard-hoverBackground" />

          {/* Title skeleton */}
          <div className="mb-1">
            <div className="h-4 bg-mediaCard-hoverBackground rounded w-3/4 mb-1" />
            <div className="h-3 bg-mediaCard-hoverBackground rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export interface HorizontalMediaCardProps {
  media: MediaItem;
  linkable?: boolean;
  series?: {
    episode: number;
    season?: number;
    episodeId: string;
    seasonId: string;
  };
  percentage?: number;
  closable?: boolean;
  onClose?: () => void;
  onShowDetails?: (media: MediaItem) => void;
  forceSkeleton?: boolean;
  editable?: boolean;
  onEdit?: () => void;
}

function checkReleased(media: MediaItem): boolean {
  const isReleasedYear = Boolean(
    media.year && media.year <= new Date().getFullYear(),
  );
  const isReleasedDate = Boolean(
    media.release_date && media.release_date <= new Date(),
  );

  // If the media has a release date, use that, otherwise use the year
  const isReleased = media.release_date ? isReleasedDate : isReleasedYear;

  return isReleased;
}

function HorizontalMediaCardContent({
  media,
  linkable,
  series,
  percentage,
  closable,
  onClose,
  onShowDetails,
  forceSkeleton,
  editable,
  onEdit,
}: HorizontalMediaCardProps) {
  const { t } = useTranslation();
  const percentageString = `${Math.round(percentage ?? 0).toFixed(0)}%`;

  const isReleased = useCallback(() => checkReleased(media), [media]);
  const canLink = linkable && !closable && isReleased();

  const dotListContent = [t(`media.types.${media.type}`)];
  const [searchQuery] = useSearchQuery();

  // Intersection observer for lazy loading
  const { targetRef, hasIntersected } = useIntersectionObserver({
    rootMargin: "300px",
  });

  // State for the backdrop image URL
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Fetch high-quality backdrop on mount
  useEffect(() => {
    let isMounted = true;

    // Start with a fallback/placeholder or the basic cached merged image if needed immediately (optional)
    // But we prefer waiting for the high-quality one or falling back gracefully
    const fetchImage = async () => {
      const url = await getMediaBackdropEn(media.id, media.type);
      if (isMounted) {
        // If we got a URL, use it. If not, fall back to the standard backdrop
        setImageUrl(url || getMediaBackdrop(media.backdrop || null));
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [media.id, media.type]);

  // Prefetch backdrop image once we have a URL
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const shouldShowSkeleton = forceSkeleton || (!media.title && !media.backdrop);

  if (shouldShowSkeleton) {
    return (
      <div ref={targetRef as React.RefObject<HTMLDivElement>}>
        <HorizontalMediaCardSkeleton />
      </div>
    );
  }

  if (isReleased() && media.year) {
    dotListContent.push(media.year.toFixed());
  }

  if (!isReleased()) {
    dotListContent.push(t("media.unreleased"));
  }

  return (
    <Flare.Base
      className={`group -m-[0.705em] rounded-xl bg-background-main transition-colors duration-300 focus:relative focus:z-10 ${
        canLink ? "hover:bg-mediaCard-hoverBackground tabbable" : ""
      } ${closable ? "jiggle" : ""}`}
      tabIndex={canLink ? 0 : -1}
      onKeyUp={(e) => e.key === "Enter" && e.currentTarget.click()}
    >
      <Flare.Light
        flareSize={300}
        cssColorVar="--colors-mediaCard-hoverAccent"
        backgroundClass="bg-mediaCard-hoverBackground duration-100"
        className={classNames({
          "rounded-xl bg-background-main group-hover:opacity-100": canLink,
        })}
      />
      <Flare.Child
        className={`pointer-events-auto relative mb-2 p-[0.4em] transition-transform duration-300 ${
          canLink ? "" : "opacity-60"
        }`}
      >
        <div
          className={classNames(
            "relative mb-2 pb-[56.25%] w-full overflow-hidden rounded-xl bg-mediaCard-hoverBackground bg-cover bg-center transition-[border-radius] duration-300",
            {
              "group-hover:rounded-lg": canLink,
            },
          )}
          style={{
            backgroundImage: `url(${imageUrl})`,
          }}
        >
          {/* Play button overlay - Desktop only */}
          {canLink && (
            <div className="absolute inset-0 hidden md:flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
                <svg
                  className="w-6 h-6 text-black ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {series ? (
            <div className="absolute right-2 top-2 z-20 rounded-md bg-mediaCard-badge px-2 py-1 transition-colors">
              <p
                className={classNames(
                  "text-center text-xs font-bold text-mediaCard-badgeText transition-colors",
                  closable ? "" : "group-hover:text-white",
                )}
              >
                {t("media.episodeDisplay", {
                  season: series.season || 1,
                  episode: series.episode,
                })}
              </p>
            </div>
          ) : null}

          {media.badge && (
            <div className="absolute right-2 top-2 z-20 rounded-md bg-white text-black px-2 py-1 font-black text-[10px] tracking-wider shadow-lg">
              {media.badge.toUpperCase()}
            </div>
          )}

          {percentage !== undefined ? (
            <>
              <div
                className={`absolute inset-x-0 -bottom-px pb-1 h-8 bg-gradient-to-t from-mediaCard-shadow to-transparent transition-colors ${
                  canLink ? "group-hover:from-mediaCard-hoverShadow" : ""
                }`}
              />
              <div className="absolute inset-x-0 bottom-0 p-2">
                <div className="relative h-1 overflow-hidden rounded-full bg-mediaCard-barColor">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-mediaCard-barFillColor"
                    style={{
                      width: percentageString,
                    }}
                  />
                </div>
              </div>
            </>
          ) : null}

          {!closable && (
            <div
              className="absolute top-2 left-2 bookmark-button"
              onClick={(e) => e.preventDefault()}
            >
              <MediaBookmarkButton media={media} />
            </div>
          )}

          <div
            className={`absolute inset-0 flex items-center justify-center bg-mediaCard-badge bg-opacity-80 transition-opacity duration-500 ${
              closable ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <IconPatch
              clickable
              className="text-2xl text-mediaCard-badgeText transition-transform hover:scale-110 duration-500"
              onClick={() => closable && onClose?.()}
              icon={X}
            />
          </div>
        </div>

        {/* Title hidden for horizontal cards as it's merged into the image */}
        <div className="media-info-container mt-1 justify-start flex flex-wrap">
          <DotList
            className="text-[10px] md:text-xs text-type-secondary"
            content={dotListContent}
          />
        </div>

        {!closable && (
          <div className="absolute bottom-2 right-2">
            <button
              className="media-more-button p-1.5 hover:bg-white/10 rounded-full transition-colors"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShowDetails?.(media);
              }}
            >
              <LucideIcon
                className="text-xs font-semibold text-type-secondary"
                icon={Ellipsis}
              />
            </button>
          </div>
        )}
      </Flare.Child>
    </Flare.Base>
  );
}

export function HorizontalMediaCard(props: HorizontalMediaCardProps) {
  const { media, onShowDetails, forceSkeleton } = props;
  const { showModal } = useOverlayStack();
  const enableDetailsModal = usePreferencesStore(
    (state) => state.enableDetailsModal,
  );

  const isReleased = useCallback(
    () => checkReleased(props.media),
    [props.media],
  );

  const canLink = props.linkable && !props.closable && isReleased();

  let link = canLink
    ? `/media/${encodeURIComponent(mediaItemToId(props.media))}`
    : "#";
  if (canLink && props.series) {
    if (props.series.season === 0 && !props.series.episodeId) {
      link += `/${encodeURIComponent(props.series.seasonId)}`;
    } else {
      link += `/${encodeURIComponent(
        props.series.seasonId,
      )}/${encodeURIComponent(props.series.episodeId)}`;
    }
  }

  const handleShowDetails = useCallback(async () => {
    if (onShowDetails) {
      onShowDetails(media);
      return;
    }

    showModal("details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  }, [media, showModal, onShowDetails]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (enableDetailsModal && canLink) {
      e.preventDefault();
      handleShowDetails();
    }
  };

  const handleCardContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleShowDetails();
  };

  const content = (
    <HorizontalMediaCardContent
      {...props}
      onShowDetails={handleShowDetails}
      forceSkeleton={forceSkeleton}
    />
  );

  if (!canLink) {
    return (
      <span
        className="relative block"
        onClick={(e) => {
          if (e.defaultPrevented) {
            e.preventDefault();
          }
        }}
        onContextMenu={handleCardContextMenu}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      to={link}
      state={{ backdrop: media.backdrop, poster: media.poster, meta: media }}
      tabIndex={-1}
      className={classNames(
        "tabbable block",
        props.closable ? "hover:cursor-default" : "",
      )}
      onClick={handleCardClick}
      onContextMenu={handleCardContextMenu}
    >
      {content}
    </Link>
  );
}
