import classNames from "classnames";
import { useRef } from "react";
import { Helmet } from "react-helmet-async";

import { WideContainer } from "@/components/layout/WideContainer";
import { useDiscoverStore } from "@/stores/discover";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { useProgressStore } from "@/stores/progress";
import { shouldShowProgress } from "@/stores/progress/utils";
import { MediaItem } from "@/utils/mediaTypes";

import { SubPageLayout } from "../layouts/SubPageLayout";
import { FeaturedCarousel } from "./components/FeaturedCarousel";
import type { FeaturedMedia } from "./components/FeaturedCarousel";
import DiscoverContent from "./discoverContent";
import { WatchingCarousel } from "../parts/home/WatchingCarousel";
import { PageTitle } from "../parts/util/PageTitle";

export function Discover() {
  const { showModal } = useOverlayStack();
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const itemsLength = useProgressStore((state) => {
    return Object.entries(state.items).filter(
      (entry) => shouldShowProgress(entry[1]).show,
    ).length;
  });

  const handleShowDetails = (media: FeaturedMedia | MediaItem) => {
    showModal("discover-details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  return (
    <SubPageLayout>
      <Helmet>
        {/* Hide scrollbar */}
        <style type="text/css">{`
            html, body {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
          `}</style>
      </Helmet>

      <PageTitle subpage k="global.pages.discover" />

      <div className="-mt-6 lg:mt-[-170px]">
        {/* Featured Carousel */}
        <FeaturedCarousel onShowDetails={handleShowDetails} />
      </div>

      {/* Continue Watching Section */}
      {itemsLength > 0 && (
        <WideContainer topMargin="mt-3 md:mt-24" ultraWide>
          <WatchingCarousel
            carouselRefs={carouselRefs}
            onShowDetails={handleShowDetails}
          />
        </WideContainer>
      )}

      {/* Mobile Category Switch */}
      <div className="flex md:hidden justify-center items-center gap-4 my-6 relative z-20">
        <button
          type="button"
          onClick={() => {
            useDiscoverStore.getState().setSelectedCategory("movies");
            window.scrollTo(0, 0);
          }}
          className={classNames(
            "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
            useDiscoverStore((state) => state.selectedCategory) === "movies"
              ? "bg-white text-black shadow-lg scale-105"
              : "bg-white/10 text-white hover:bg-white/20",
          )}
        >
          Movies
        </button>
        <button
          type="button"
          onClick={() => {
            useDiscoverStore.getState().setSelectedCategory("tvshows");
            window.scrollTo(0, 0);
          }}
          className={classNames(
            "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
            useDiscoverStore((state) => state.selectedCategory) === "tvshows"
              ? "bg-white text-black shadow-lg scale-105"
              : "bg-white/10 text-white hover:bg-white/20",
          )}
        >
          TV Shows
        </button>
      </div>

      {/* Main Content */}
      <WideContainer topMargin="mt-4" ultraWide>
        <DiscoverContent />
      </WideContainer>
    </SubPageLayout>
  );
}
