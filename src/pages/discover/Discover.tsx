import { useRef } from "react";
import { Helmet } from "react-helmet-async";

import { WideContainer } from "@/components/layout/WideContainer";
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

      <div className="!mt-[-170px]">
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

      {/* Main Content */}
      <WideContainer topMargin="mt-4" ultraWide>
        <DiscoverContent />
      </WideContainer>
    </SubPageLayout>
  );
}
