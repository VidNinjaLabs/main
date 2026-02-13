import classNames from "classnames";
import { useRef } from "react";

import { WideContainer } from "@/components/layout/WideContainer";
import { useDiscoverStore } from "@/stores/discover";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { useProgressStore } from "@/stores/progress";
import { MediaItem } from "@/utils/mediaTypes";
import i18n from "i18next";

import type { FeaturedMedia } from "./components/FeaturedCarousel";
import { LazyLoadCuratedLists } from "./components/LazyLoadCuratedLists";
import { MediaCarousel } from "./components/MediaCarousel";
import { ScrollToTopButton } from "./components/ScrollToTopButton";

const t = i18n.t;

export function DiscoverContent() {
  const { selectedCategory, setSelectedCategory } = useDiscoverStore();
  const { showModal } = useOverlayStack();
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const progressItems = useProgressStore((state) => state.items);

  // Only load data for the active tab
  const isMoviesTab = selectedCategory === "movies";
  const isTVShowsTab = selectedCategory === "tvshows";

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category as "movies" | "tvshows");
  };

  const handleShowDetails = async (media: MediaItem | FeaturedMedia) => {
    showModal("discover-details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  const movieProgressItems = Object.entries(progressItems || {}).filter(
    ([_, item]) => item.type === "movie",
  );
  const tvProgressItems = Object.entries(progressItems || {}).filter(
    ([_, item]) => item.type === "show",
  );

  // Render Movies content with lazy loading
  const renderMoviesContent = () => {
    return (
      <>
        {/* Movie Recommendations - only show if there are movie progress items */}
        {movieProgressItems.length > 0 && (
          <MediaCarousel
            content={{ type: "recommendations" }}
            isTVShow={false}
            carouselRefs={carouselRefs}
            onShowDetails={handleShowDetails}
            moreContent
            showRecommendations
          />
        )}

        {/* Latest Releases */}
        <MediaCarousel
          content={{ type: "latest", fallback: "nowPlaying" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* 4K Releases */}
        <MediaCarousel
          content={{ type: "latest4k", fallback: "popular" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Top Rated */}
        <MediaCarousel
          content={{ type: "topRated" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Indian Movies */}
        <MediaCarousel
          content={{ type: "indianContent" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Korean Movies */}
        <MediaCarousel
          content={{ type: "koreanContent" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Anime Movies */}
        <MediaCarousel
          content={{ type: "animeContent" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Provider Movies */}
        <MediaCarousel
          content={{ type: "provider" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showProviders
          moreContent
        />

        {/* Genre Movies */}
        <MediaCarousel
          content={{ type: "genre" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showGenres
          moreContent
        />
      </>
    );
  };

  // Render TV Shows content with lazy loading
  const renderTVShowsContent = () => {
    return (
      <>
        {/* TV Show Recommendations - only show if there are TV show progress items */}
        {tvProgressItems.length > 0 && (
          <MediaCarousel
            content={{ type: "recommendations" }}
            isTVShow
            carouselRefs={carouselRefs}
            onShowDetails={handleShowDetails}
            moreContent
            showRecommendations
          />
        )}

        {/* On Air */}
        <MediaCarousel
          content={{ type: "latesttv", fallback: "onTheAir" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Top Rated */}
        <MediaCarousel
          content={{ type: "topRated" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Popular */}
        <MediaCarousel
          content={{ type: "popular" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Indian TV Shows */}
        <MediaCarousel
          content={{ type: "indianContent" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Korean Dramas */}
        <MediaCarousel
          content={{ type: "koreanContent" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Anime Series */}
        <MediaCarousel
          content={{ type: "animeContent" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Provider TV Shows */}
        <MediaCarousel
          content={{ type: "provider" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showProviders
          moreContent
        />

        {/* Genre TV Shows */}
        <MediaCarousel
          content={{ type: "genre" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showGenres
          moreContent
        />
      </>
    );
  };

  // Render Editor Picks content
  const renderEditorPicksContent = () => {
    return (
      <>
        <MediaCarousel
          content={{ type: "editorPicks" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />
        <MediaCarousel
          content={{ type: "editorPicks" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />
      </>
    );
  };

  return (
    <div className="relative min-h-screen">
      <WideContainer ultraWide classNames="!px-0">
        {/* Category Toggle - Removed as it is now in Navigation */}

        {/* Movies Tab */}
        <div
          className={classNames(
            "transition-opacity duration-300",
            isMoviesTab ? "opacity-100" : "opacity-0 hidden",
          )}
        >
          {renderMoviesContent()}
        </div>

        {/* TV Shows Tab */}
        <div
          className={classNames(
            "transition-opacity duration-300",
            isTVShowsTab ? "opacity-100" : "opacity-0 hidden",
          )}
        >
          {renderTVShowsContent()}
        </div>
      </WideContainer>

      {/* Lazy-loaded Curated Movie Lists */}
      {isMoviesTab && (
        <WideContainer ultraWide classNames="!px-0">
          <LazyLoadCuratedLists
            onShowDetails={handleShowDetails}
            carouselRefs={carouselRefs}
          />
        </WideContainer>
      )}

      <ScrollToTopButton />

      {/* DetailsModal is now managed by overlayStack */}
    </div>
  );
}

export default DiscoverContent;
