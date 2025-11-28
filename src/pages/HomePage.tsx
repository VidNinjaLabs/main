import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { WideContainer } from "@/components/layout/WideContainer";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { FeaturedCarousel } from "@/pages/discover/components/FeaturedCarousel";
import type { FeaturedMedia } from "@/pages/discover/components/FeaturedCarousel";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import { SearchListPart } from "@/pages/parts/search/SearchListPart";
import { SearchLoadingPart } from "@/pages/parts/search/SearchLoadingPart";
import { conf } from "@/setup/config";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { usePreferencesStore } from "@/stores/preferences";
import { MediaItem } from "@/utils/mediaTypes";

import { AdsPart } from "./parts/home/AdsPart";

function useSearch(search: string) {
  const [searching, setSearching] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const debouncedSearch = useDebounce<string>(search, 500);
  useEffect(() => {
    setSearching(search !== "");
    setLoading(search !== "");
    if (search !== "") {
      window.scrollTo(0, 0);
    }
  }, [search]);
  useEffect(() => {
    setLoading(false);
  }, [debouncedSearch]);

  return {
    loading,
    searching,
  };
}

// What the sigma?

export function HomePage() {
  const { t } = useTranslation();
  const searchParams = useSearchQuery();
  const [search] = searchParams;
  const s = useSearch(search);
  const { showModal } = useOverlayStack();
  const enableFeatured = usePreferencesStore((state) => state.enableFeatured);

  const handleShowDetails = async (media: MediaItem | FeaturedMedia) => {
    showModal("details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  return (
    <HomeLayout showBg={false}>
      <div className="mb-2">
        <Helmet>
          <style type="text/css">{`
            html, body {
              scrollbar-gutter: stable;
            }
          `}</style>
          <title>{t("global.name")}</title>
        </Helmet>

        {/* Page Header */}
        {enableFeatured ? (
          <FeaturedCarousel
            forcedCategory="movies"
            onShowDetails={handleShowDetails}
            searching={s.searching}
            shorter
          />
        ) : null}

        {conf().SHOW_AD ? <AdsPart /> : null}
      </div>

      {/* Search */}
      {search && (
        <div className="pt-36">
          <WideContainer>
            {s.loading ? (
              <SearchLoadingPart />
            ) : (
              s.searching && (
                <SearchListPart
                  searchQuery={search}
                  onShowDetails={handleShowDetails}
                />
              )
            )}
          </WideContainer>
        </div>
      )}
    </HomeLayout>
  );
}
