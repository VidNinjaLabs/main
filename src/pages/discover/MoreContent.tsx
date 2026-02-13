import { ArrowLeft } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIntersection, useWindowSize } from "react-use";

import { Dropdown, OptionItem } from "@/components/form/Dropdown";
import { Icon, Icons } from "@/components/Icon";
import { WideContainer } from "@/components/layout/WideContainer";
import { HorizontalMediaCard } from "@/components/media/HorizontalMediaCard";
import { HorizontalMediaGrid } from "@/components/media/HorizontalMediaGrid";
import { Heading1 } from "@/components/utils/Text";
import {
  DiscoverContentType,
  MediaType,
  useDiscoverMedia,
  useDiscoverOptions,
} from "@/pages/discover/hooks/useDiscoverMedia";
import { INDIAN_LANGUAGES } from "@/pages/discover/types/discover";
import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { useDiscoverStore } from "@/stores/discover";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { useProgressStore } from "@/stores/progress";
import { MediaItem } from "@/utils/mediaTypes";
import { useTranslation } from "react-i18next";
import { MediaGrid } from "@/components/media/MediaGrid";

interface MoreContentProps {
  onShowDetails?: (media: MediaItem) => void;
}

export function MoreContent({ onShowDetails }: MoreContentProps) {
  const { mediaType = "movie", contentType, id, category } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<OptionItem | null>(
    null,
  );
  const [selectedGenre, setSelectedGenre] = useState<OptionItem | null>(null);
  const [selectedRecommendationId, setSelectedRecommendationId] =
    useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("hi"); // Default to Hindi
  const [isContentVisible, setIsContentVisible] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showModal } = useOverlayStack();
  const { lastView } = useDiscoverStore();
  const { width: windowWidth } = useWindowSize();
  const progressStore = useProgressStore();

  // Infinite scroll setup
  const loadMoreRef = useRef(null);
  const intersection = useIntersection(loadMoreRef, {
    root: null,
    rootMargin: "400px",
    threshold: 0,
  });

  // Get available providers and genres
  const { providers, genres } = useDiscoverOptions(mediaType as MediaType);

  // Get recommendation sources from progress store
  const recommendationSources = Object.entries(progressStore.items || {})
    .filter(
      ([_itemId, item]) =>
        item.type === (mediaType === "tv" ? "show" : "movie"),
    )
    .map(([itemId, item]) => ({
      id: itemId,
      title: item.title || "",
    }));

  // Determine the actual content type and ID from URL parameters
  const actualContentType = contentType || category?.split("-")[0] || "popular";
  const actualMediaType =
    mediaType || (category?.endsWith("-tv") ? "tv" : "movie");

  // Fetch media using our hook
  const {
    media: mediaItems,
    isLoading,
    hasMore,
    sectionTitle,
  } = useDiscoverMedia({
    contentType: actualContentType as DiscoverContentType,
    mediaType: actualMediaType as MediaType,
    id:
      id ||
      selectedProvider?.id ||
      selectedGenre?.id ||
      selectedRecommendationId,
    page: currentPage,
    genreName: selectedGenre?.name,
    providerName: selectedProvider?.name,
    mediaTitle: recommendationSources.find(
      (s) => s.id === selectedRecommendationId,
    )?.title,
    language:
      actualContentType === "indianContent" ? selectedLanguage : undefined,
    isCarouselView: false,
  });

  // Handle content visibility
  useEffect(() => {
    if (!isLoading || currentPage > 1) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
    setIsContentVisible(false);
  }, [isLoading, mediaItems, currentPage]);

  // Scroll to top when entering the page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [contentType, mediaType, id]);

  const handleBack = () => {
    if (lastView) {
      navigate(lastView.url);
      window.scrollTo(0, lastView.scrollPosition);
    } else {
      navigate(-1);
    }
  };

  const handleShowDetails = async (media: MediaItem) => {
    if (onShowDetails) {
      onShowDetails(media);
      return;
    }
    showModal("discover-details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  const handleLoadMore = async () => {
    setCurrentPage((prev) => prev + 1);
  };

  // Trigger load more when sentinel is visible
  useEffect(() => {
    if (intersection?.isIntersecting && hasMore && !isLoading) {
      handleLoadMore();
    }
  }, [intersection?.isIntersecting, hasMore, isLoading]);

  // Set initial provider/genre/recommendation selection
  useEffect(() => {
    if (contentType === "provider" && id) {
      const provider = providers.find((p) => p.id === id);
      if (provider) {
        setSelectedProvider({ id: provider.id, name: provider.name });
      }
    } else if (contentType === "genre" && id) {
      const genre = genres.find((g) => g.id.toString() === id);
      if (genre) {
        setSelectedGenre({ id: genre.id.toString(), name: genre.name });
      }
    } else if (contentType === "recommendations" && id) {
      setSelectedRecommendationId(id);
    }
  }, [contentType, id, providers, genres]);

  // Handle selection changes
  useEffect(() => {
    if (contentType === "provider" && selectedProvider) {
      navigate(
        `/discover/more/provider/${selectedProvider.id}/${actualMediaType}`,
      );
    } else if (contentType === "genre" && selectedGenre) {
      navigate(`/discover/more/genre/${selectedGenre.id}/${actualMediaType}`);
    } else if (contentType === "recommendations" && selectedRecommendationId) {
      navigate(
        `/discover/more/recommendations/${selectedRecommendationId}/${actualMediaType}`,
      );
    }
  }, [
    selectedProvider,
    selectedGenre,
    selectedRecommendationId,
    contentType,
    actualMediaType,
    navigate,
  ]);

  // Split buttons into visible and dropdown based on window width
  const { visibleButtons, dropdownButtons } = React.useMemo(() => {
    const items =
      contentType === "provider"
        ? providers
        : contentType === "genre"
          ? genres
          : [];

    const visible = windowWidth > 850 ? items.slice(0, 7) : items.slice(0, 2);
    const dropdown = windowWidth > 850 ? items.slice(7) : items.slice(2);

    return { visibleButtons: visible, dropdownButtons: dropdown };
  }, [contentType, providers, genres, windowWidth]);

  if (isLoading && currentPage === 1) {
    return (
      <SubPageLayout>
        <WideContainer>
          <div className="animate-pulse">
            <div className="h-8 bg-mediaCard-hoverBackground rounded w-1/4 mb-8" />
            <HorizontalMediaGrid>
              {Array(20)
                .fill(null)
                .map(() => (
                  <div
                    key={`loading-skeleton-${Math.random().toString(36).substring(2)}`}
                    className="relative group cursor-default user-select-none rounded-xl p-2 bg-transparent"
                  >
                    <div className="animate-pulse">
                      <div className="w-full aspect-video bg-mediaCard-hoverBackground rounded-lg" />
                      <div className="mt-2 h-4 bg-mediaCard-hoverBackground rounded w-3/4" />
                    </div>
                  </div>
                ))}
            </HorizontalMediaGrid>
          </div>
        </WideContainer>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout>
      <WideContainer>
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center text-white hover:text-type-link transition-colors p-1.5 hover:bg-mediaCard-hoverBackground rounded-full mb-9 self-center"
              aria-label={t("discover.page.back")}
            >
              <ArrowLeft className="w-8 h-8" />
            </button>
            <Heading1 className="text-2xl font-bold text-white">
              {sectionTitle}
            </Heading1>
          </div>
          {contentType === "recommendations" && (
            <div className="relative pr-4">
              <Dropdown
                selectedItem={
                  recommendationSources.find(
                    (s) => s.id === selectedRecommendationId,
                  )
                    ? {
                        id: selectedRecommendationId,
                        name:
                          recommendationSources.find(
                            (s) => s.id === selectedRecommendationId,
                          )?.title || "",
                      }
                    : { id: "", name: "..." }
                }
                setSelectedItem={(item) => setSelectedRecommendationId(item.id)}
                options={recommendationSources.map((source) => ({
                  id: source.id,
                  name: source.title,
                }))}
                customButton={
                  <button
                    type="button"
                    className="px-2 py-1 text-sm bg-mediaCard-hoverBackground rounded-full hover:bg-mediaCard-background transition-colors flex items-center gap-1"
                  >
                    <span>{t("discover.carousel.change")}</span>
                    <Icon
                      icon={Icons.UP_DOWN_ARROW}
                      className="text-xs text-dropdown-secondary"
                    />
                  </button>
                }
                side="right"
              />
            </div>
          )}

          {/* Language filter for Indian content - inline on desktop */}
          {contentType === "indianContent" && windowWidth > 768 && (
            <div className="flex items-center space-x-2">
              {INDIAN_LANGUAGES.slice(0, 7).map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => {
                    setSelectedLanguage(lang.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                    selectedLanguage === lang.id
                      ? "bg-mediaCard-background"
                      : "bg-mediaCard-hoverBackground hover:bg-mediaCard-background"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
              {INDIAN_LANGUAGES.length > 7 && (
                <div className="relative">
                  <Dropdown
                    selectedItem={{
                      id: selectedLanguage,
                      name:
                        INDIAN_LANGUAGES.find((l) => l.id === selectedLanguage)
                          ?.name || "Hindi",
                    }}
                    setSelectedItem={(item) => {
                      setSelectedLanguage(item.id);
                      setCurrentPage(1);
                    }}
                    options={INDIAN_LANGUAGES.slice(7).map((lang) => ({
                      id: lang.id,
                      name: lang.name,
                    }))}
                    customButton={
                      <button
                        type="button"
                        className="px-3 py-1 text-sm bg-mediaCard-hoverBackground hover:bg-mediaCard-background rounded-full transition-colors flex items-center gap-1"
                      >
                        <span>...</span>
                        <Icon
                          icon={Icons.UP_DOWN_ARROW}
                          className="text-xs text-dropdown-secondary"
                        />
                      </button>
                    }
                    side="right"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Language filter for Indian content - horizontal scroll on mobile */}
        {contentType === "indianContent" && windowWidth <= 768 && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 mb-4">
            <div className="flex items-center space-x-2 w-max">
              {INDIAN_LANGUAGES.map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => {
                    setSelectedLanguage(lang.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                    selectedLanguage === lang.id
                      ? "bg-mediaCard-background"
                      : "bg-mediaCard-hoverBackground hover:bg-mediaCard-background"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Provider/Genre filter - desktop: inline with dropdown */}
        {(contentType === "provider" || contentType === "genre") &&
          windowWidth > 768 && (
            <div className="flex items-center space-x-2 mb-4">
              {visibleButtons.map((item: any) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    if (contentType === "provider") {
                      setSelectedProvider({ id: item.id, name: item.name });
                    } else {
                      setSelectedGenre({
                        id: item.id.toString(),
                        name: item.name,
                      });
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                    item.id.toString() ===
                    (selectedProvider?.id || selectedGenre?.id)
                      ? "bg-mediaCard-background"
                      : "bg-mediaCard-hoverBackground hover:bg-mediaCard-background"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              {dropdownButtons.length > 0 && (
                <div className="relative">
                  <Dropdown
                    selectedItem={
                      contentType === "provider"
                        ? selectedProvider || { id: "", name: "..." }
                        : selectedGenre || { id: "", name: "..." }
                    }
                    setSelectedItem={(item) => {
                      if (contentType === "provider") {
                        setSelectedProvider(item);
                      } else {
                        setSelectedGenre(item);
                      }
                    }}
                    options={dropdownButtons.map((item: any) => ({
                      id:
                        contentType === "provider"
                          ? item.id
                          : item.id.toString(),
                      name: item.name,
                    }))}
                    customButton={
                      <button
                        type="button"
                        className="px-3 py-1 text-sm bg-mediaCard-hoverBackground hover:bg-mediaCard-background rounded-full transition-colors flex items-center gap-1"
                      >
                        <span>...</span>
                        <Icon
                          icon={Icons.UP_DOWN_ARROW}
                          className="text-xs text-dropdown-secondary"
                        />
                      </button>
                    }
                    side="right"
                  />
                </div>
              )}
            </div>
          )}

        {/* Provider/Genre filter - mobile: horizontal scroll */}
        {(contentType === "provider" || contentType === "genre") &&
          windowWidth <= 768 && (
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 mb-4">
              <div className="flex items-center space-x-2 w-max">
                {(contentType === "provider" ? providers : genres).map(
                  (item: any) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        if (contentType === "provider") {
                          setSelectedProvider({ id: item.id, name: item.name });
                        } else {
                          setSelectedGenre({
                            id: item.id.toString(),
                            name: item.name,
                          });
                        }
                      }}
                      className={`px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                        item.id.toString() ===
                        (selectedProvider?.id || selectedGenre?.id)
                          ? "bg-mediaCard-background"
                          : "bg-mediaCard-hoverBackground hover:bg-mediaCard-background"
                      }`}
                    >
                      {item.name}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

        <div
          className={`transition-opacity duration-300 ease-in-out ${
            isContentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <HorizontalMediaGrid>
            {mediaItems.map((item) => {
              const isTVShow = Boolean(item.first_air_date);
              const releaseDate = isTVShow
                ? item.first_air_date
                : item.release_date;
              const year = releaseDate
                ? parseInt(releaseDate.split("-")[0], 10)
                : undefined;

              const mediaItem: MediaItem = {
                id: item.id.toString(),
                title: item.title || item.name || "",
                poster: item.poster_path
                  ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                  : "/placeholder.png",
                backdrop: item.backdrop_path || undefined,
                type: isTVShow ? "show" : "movie",
                year,
                release_date: releaseDate ? new Date(releaseDate) : undefined,
              };

              return (
                <div
                  key={item.id}
                  style={{ userSelect: "none" }}
                  onContextMenu={(e: React.MouseEvent<HTMLDivElement>) =>
                    e.preventDefault()
                  }
                >
                  <HorizontalMediaCard
                    media={mediaItem}
                    onShowDetails={handleShowDetails}
                    linkable
                  />
                </div>
              );
            })}
          </HorizontalMediaGrid>

          {hasMore && (
            <div
              ref={loadMoreRef}
              className="flex justify-center mt-8 min-h-[60px] items-center"
            >
              {isLoading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-type-link border-t-transparent rounded-full" />
                  <span className="text-type-secondary">
                    {t("discover.page.loading")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </WideContainer>
    </SubPageLayout>
  );
}
