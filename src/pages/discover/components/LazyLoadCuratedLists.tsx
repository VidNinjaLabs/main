import i18n from "i18next";
const t = i18n.t;
import { useEffect, useRef, useState } from "react";
import { useIntersection } from "react-use";

import {
  getCuratedMovieLists,
  getMovieDetailsForIds,
} from "@/backend/metadata/traktApi";
import { TMDBMovieData } from "@/backend/metadata/types/tmdb";
import type { CuratedMovieList } from "@/backend/metadata/types/trakt";
import { HorizontalMediaCard } from "@/components/media/HorizontalMediaCard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CarouselNavButtons } from "@/pages/discover/components/CarouselNavButtons";
import { MediaItem } from "@/utils/mediaTypes";

interface LazyLoadCuratedListsProps {
  onShowDetails: (media: MediaItem) => void;
  carouselRefs: React.MutableRefObject<{
    [key: string]: HTMLDivElement | null;
  }>;
}

export function LazyLoadCuratedLists({
  onShowDetails,
  carouselRefs,
}: LazyLoadCuratedListsProps) {
  const [curatedLists, setCuratedLists] = useState<CuratedMovieList[]>([]);
  const [movieDetails, setMovieDetails] = useState<{
    [listSlug: string]: TMDBMovieData[];
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isMobile } = useIsMobile();

  // Intersection observer ref
  const triggerRef = useRef<HTMLDivElement>(null);
  const intersection = useIntersection(triggerRef, {
    root: null,
    rootMargin: "200px", // Start loading 200px before it comes into view
    threshold: 0,
  });

  // Load content when the trigger element is visible
  useEffect(() => {
    if (intersection?.isIntersecting && !hasLoaded && !isLoading) {
      setIsLoading(true);
      setHasLoaded(true);

      const fetchCuratedLists = async () => {
        try {
          const lists = await getCuratedMovieLists();
          setCuratedLists(lists);

          // Fetch movie details for each list one after another
          const details: { [listSlug: string]: TMDBMovieData[] } = {};
          for (const list of lists) {
            try {
              const movies = await getMovieDetailsForIds(list.tmdbIds, 50);
              if (movies.length > 0) {
                details[list.listSlug] = movies;
                setMovieDetails({ ...details });
              }
            } catch (error) {
              console.error(
                `Failed to fetch movies for list ${list.listSlug}:`,
                error,
              );
            }
          }
        } catch (error) {
          console.error("Failed to fetch curated lists:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCuratedLists();
    }
  }, [intersection?.isIntersecting, hasLoaded, isLoading]);

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div ref={triggerRef} className="mt-8">
      {/* Loading skeleton */}
      {isLoading && curatedLists.length === 0 && (
        <div className="flex flex-col gap-8 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-8 bg-mediaCard-hoverBackground rounded w-1/4 ml-8 mb-4" />
              <div className="flex gap-4 overflow-hidden px-8">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="w-[16rem] md:w-[20rem] flex-shrink-0">
                    <div className="aspect-video bg-mediaCard-hoverBackground rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Curated Movie Lists */}
      {curatedLists.map((list) => (
        <div key={list.listSlug}>
          <div className="flex items-center justify-between ml-2 md:ml-8 mt-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl cursor-default font-bold text-white md:text-2xl pl-5 text-balance">
                  {list.listName}
                </h2>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden carousel-container md:pb-4">
            <div
              className="grid grid-flow-col auto-cols-max gap-4 pt-0 overflow-x-scroll scrollbar-hide rounded-xl overflow-y-hidden md:pl-8 md:pr-8"
              ref={(el) => {
                carouselRefs.current[list.listSlug] = el;
              }}
              onWheel={handleWheel}
            >
              <div className="md:w-6" />
              {movieDetails[list.listSlug]?.map((movie: TMDBMovieData) => (
                <div
                  key={movie.id}
                  className="relative mt-4 group cursor-pointer user-select-none rounded-xl p-2 bg-transparent transition-colors duration-300 w-[16rem] md:w-[20rem] h-auto"
                >
                  <HorizontalMediaCard
                    linkable
                    media={{
                      id: movie.id.toString(),
                      title: movie.title,
                      poster: movie.poster_path
                        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                        : "/placeholder.png",
                      backdrop: movie.backdrop_path
                        ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                        : undefined,
                      type: "movie",
                      year: movie.release_date
                        ? parseInt(movie.release_date.split("-")[0], 10)
                        : undefined,
                    }}
                    onShowDetails={onShowDetails}
                  />
                </div>
              ))}
              <div className="md:w-6" />
            </div>
            {!isMobile && (
              <CarouselNavButtons
                categorySlug={list.listSlug}
                carouselRefs={carouselRefs}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
