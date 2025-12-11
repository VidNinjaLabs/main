import { useParams } from "react-router-dom";

import { WideContainer } from "@/components/layout/WideContainer";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import { SearchListPart } from "@/pages/parts/search/SearchListPart";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { MediaItem } from "@/utils/mediaTypes";

export function BrowsePage() {
  const { query: urlQuery } = useParams<{ query?: string }>();
  const [searchQuery] = useSearchQuery();
  const { showModal } = useOverlayStack();

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
        <div className="pt-36">
          {activeQuery ? (
            <SearchListPart
              searchQuery={activeQuery}
              onShowDetails={handleShowDetails}
            />
          ) : (
            <div className="text-center py-12 text-type-dimmed">
              <p>Enter a search query to browse movies and TV shows</p>
            </div>
          )}
        </div>
      </WideContainer>
    </HomeLayout>
  );
}
