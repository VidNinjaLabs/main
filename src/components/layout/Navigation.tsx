import classNames from "classnames";
import { Search, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, To, useNavigate } from "react-router-dom";

import { SearchBarInput } from "@/components/form/SearchBar";
import { LinksDropdown } from "@/components/LinksDropdown";
import { Lightbar } from "@/components/utils/Lightbar";
import { useRandomTranslation } from "@/hooks/useRandomTranslation";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { BlurEllipsis } from "@/pages/layouts/SubPageLayout";
import { useBannerSize } from "@/stores/banner";
import { usePreferencesStore } from "@/stores/preferences";

import { BrandPill } from "./BrandPill";

export interface NavigationProps {
  bg?: boolean;
  noLightbar?: boolean;
  doBackground?: boolean;
  clearBackground?: boolean;
}

export function Navigation(props: NavigationProps) {
  const bannerHeight = useBannerSize();
  const navigate = useNavigate();

  const [scrollPosition, setScrollPosition] = useState(0);

  const { t: randomT } = useRandomTranslation();
  const [search, setSearch, setSearchUnFocus] = useSearchQuery();
  const placeholder = randomT(`home.search.placeholder`);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (path: To) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  // Calculate mask length based on scroll position
  const getMaskLength = () => {
    // When at top (0), use longer mask (200px)
    // When scrolled down (300px+), use shorter mask (100px)
    const maxScroll = 300;
    const minLength = 100;
    const maxLength = 180;
    const scrollFactor = Math.min(scrollPosition, maxScroll) / maxScroll;
    return minLength + (maxLength - minLength) * (1 - scrollFactor);
  };

  const enableLowPerformanceMode = usePreferencesStore(
    (s) => s.enableLowPerformanceMode,
  );

  return (
    <>
      {/* lightbar */}
      {!props.noLightbar ? (
        <div
          className="absolute inset-x-0 top-0 flex h-[88px] items-center justify-center"
          style={{
            top: `${bannerHeight}px`,
          }}
        >
          <div className="absolute inset-x-0 -mt-[22%] flex items-center sm:mt-0">
            <Lightbar noParticles={enableLowPerformanceMode} />
          </div>
        </div>
      ) : null}

      {/* backgrounds - these are seperate because of z-index issues */}
      <div
        className="top-content fixed z-[20] pointer-events-none left-0 right-0 top-0 min-h-[150px]"
        style={{
          top: `${bannerHeight}px`,
        }}
      >
        <div
          className={classNames(
            "fixed left-0 right-0 top-0 flex items-center", // border-b border-utils-divider border-opacity-50
            "transition-[background-color,backdrop-filter] duration-300 ease-in-out",
            props.doBackground
              ? props.clearBackground
                ? "backdrop-blur-md bg-transparent"
                : "bg-background-main"
              : "bg-transparent",
          )}
        >
          {props.doBackground ? (
            <div className="absolute w-full h-full inset-0 overflow-hidden">
              <BlurEllipsis positionClass="absolute" />
            </div>
          ) : null}
          <div className="opacity-0 absolute inset-0 block h-20 pointer-events-auto" />
          <div
            className={classNames(
              "transition-[background-color,backdrop-filter,opacity] duration-300 ease-in-out",
              props.bg ? "opacity-100" : "opacity-0",
              "absolute inset-0 block h-[11rem]",
              props.clearBackground
                ? "backdrop-blur-md bg-transparent"
                : "bg-background-main",
            )}
            style={{
              maskImage: `linear-gradient(
                to bottom,
                rgba(0, 0, 0, 1),
                rgba(0, 0, 0, 1) calc(100% - ${getMaskLength()}px),
                rgba(0, 0, 0, 0) 100%
              )`,
              WebkitMaskImage: `linear-gradient(
                to bottom,
                rgba(0, 0, 0, 1),
                rgba(0, 0, 0, 1) calc(100% - ${getMaskLength()}px),
                rgba(0, 0, 0, 0) 100%
              )`,
            }}
          />
        </div>
      </div>

      {/* content */}
      <div
        className="top-content fixed pointer-events-none left-0 right-0 z-[500] top-0 min-h-[150px]"
        style={{
          top: `${bannerHeight}px`,
        }}
      >
        <div className={classNames("fixed left-0 right-0 flex items-center")}>
          <div className="px-3 md:px-7 py-3 md:py-5 relative z-[60] flex flex-1 items-center justify-between">
            <div className="flex items-center space-x-1.5 ssm:space-x-3 pointer-events-auto">
              <Link
                className="block tabbable rounded-full text-xs ssm:text-base"
                to="/"
                onClick={() => window.scrollTo(0, 0)}
              >
                <BrandPill
                  clickable
                  header
                  className="h-14 p-2 !py-0"
                  iconClass="text-3xl"
                />
              </Link>
            </div>

            {/* Show search box on /browse page */}
            {window.location.pathname.startsWith("/browse") && (
              <div className="flex-1 max-w-2xl mx-0 md:mx-4 pointer-events-auto flex items-center gap-2">
                <div className="flex-1">
                  <SearchBarInput
                    onChange={setSearch}
                    value={search}
                    onUnFocus={setSearchUnFocus}
                    placeholder={
                      placeholder ?? "Search for movies or TV shows..."
                    }
                    isSticky={false}
                    isInFeatured={false}
                  />
                </div>
                <a
                  onClick={() => handleClick("/discover")}
                  rel="noreferrer"
                  className="h-14 w-14 flex items-center justify-center text-white tabbable rounded-full backdrop-blur-lg cursor-pointer flex-shrink-0 bg-white/10 hover:bg-white/30 transition-all duration-200"
                >
                  <X size={28} />
                </a>
              </div>
            )}
            <div className="relative pointer-events-auto flex items-center space-x-3">
              {!enableLowPerformanceMode &&
                window.location.pathname === "/discover" && (
                  <a
                    onClick={() => handleClick("/browse")}
                    rel="noreferrer"
                    className="h-14 w-14 flex items-center justify-center text-white tabbable rounded-full backdrop-blur-lg cursor-pointer bg-white/10 hover:bg-white/30 transition-all duration-200"
                  >
                    <Search size={28} />
                  </a>
                )}
              {/* Hide settings icon on mobile browse page, show on desktop */}
              {(!window.location.pathname.startsWith("/browse") ||
                window.innerWidth >= 768) && (
                <div
                  className={
                    window.location.pathname === "/discover"
                      ? "hidden md:block"
                      : ""
                  }
                >
                  <LinksDropdown>
                    <a className="h-14 w-14 flex items-center justify-center text-white tabbable rounded-full backdrop-blur-lg cursor-pointer bg-white/10 hover:bg-white/30 transition-all duration-200">
                      <Settings size={28} />
                    </a>
                  </LinksDropdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
