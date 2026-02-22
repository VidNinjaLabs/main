/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { SearchBarInput } from "@/components/form/SearchBar";
import { WideContainer } from "@/components/layout/WideContainer";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import { SearchListPart } from "@/pages/parts/search/SearchListPart";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { MediaItem } from "@/utils/mediaTypes";

export function BrowsePage() {
  const { query: urlQuery } = useParams<{ query?: string }>();
  const [searchQuery, setSearchQuery, setSearchUnFocus] = useSearchQuery();
  const { showModal } = useOverlayStack();
  const navigate = useNavigate();

  // Use URL query param if available, otherwise use search query
  const activeQuery = urlQuery || searchQuery;

  const handleShowDetails = async (media: MediaItem) => {
    showModal("details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  return (
    <HomeLayout showBg={false}>
      <PageTitle subpage k="global.pages.search" />
      <WideContainer>
        <div className="pt-20 lg:pt-24 pb-8 px-4 flex flex-col items-center">
          <div className="w-full max-w-3xl relative top-0 z-40 transition-all duration-300">
            <SearchBarInput
              onChange={setSearchQuery}
              value={searchQuery}
              onUnFocus={setSearchUnFocus}
              placeholder="Search for movies or TV shows..."
              isSticky
              isInFeatured={false}
            />
          </div>

          <div className="w-full mt-12">
            {activeQuery ? (
              <SearchListPart
                searchQuery={activeQuery}
                onShowDetails={handleShowDetails}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <Search className="w-16 h-16 lg:w-20 lg:h-20 mb-6 text-white/40" />
                <h2 className="text-xl lg:text-3xl font-bold mb-3 text-white">
                  What are you looking for?
                </h2>
                <p className="text-sm lg:text-base text-gray-400 max-w-[300px] lg:max-w-none">
                  Start typing above to search our entire catalog of movies and
                  TV shows.
                </p>
              </div>
            )}
          </div>
        </div>
      </WideContainer>
    </HomeLayout>
  );
}
