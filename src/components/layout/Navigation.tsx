import classNames from "classnames";
import { Bell, Search, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, To, useNavigate } from "react-router-dom";

import { SearchBarInput } from "@/components/form/SearchBar";
import { LinksDropdown } from "@/components/LinksDropdown";
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
  hideSettings?: boolean;
}

export function Navigation(props: NavigationProps) {
  const bannerHeight = useBannerSize();
  const navigate = useNavigate();

  const [scrollPosition, setScrollPosition] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const { t: randomT } = useRandomTranslation();
  const [search, setSearch, setSearchUnFocus] = useSearchQuery();
  const placeholder = randomT(`home.search.placeholder`);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleClick = (path: To) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  const isDesktop = windowWidth >= 1024;

  return (
    <>
      {/* backgrounds - simplified */}
      <div
        className={classNames(
          "fixed left-0 right-0 top-0 z-[50] flex items-center",
          props.doBackground
            ? isDesktop
              ? scrollPosition > 400
                ? "bg-zinc-950/60 backdrop-blur-md h-14 md:h-20"
                : "bg-transparent h-20 md:h-24"
              : "bg-gradient-to-b from-black/90 via-black/40 to-transparent h-24 md:h-32" // Mobile ambient header
            : "bg-transparent h-20 md:h-24",
        )}
        style={{
          top: `${bannerHeight}px`,
        }}
      />

      {/* content */}
      <div
        className="top-content fixed pointer-events-none left-0 right-0 z-[500] top-0"
        style={{
          top: `${bannerHeight}px`,
        }}
      >
        <div className={classNames("flex items-center")}>
          <div className="px-3 md:px-2.5 py-1.5 md:py-2.5 relative z-[60] flex flex-1 items-center justify-between">
            {/* Left Side: Logo */}
            <div className="flex items-center space-x-1.5 ssm:space-x-3 pointer-events-auto">
              <Link
                className="block tabbable rounded-full text-xs ssm:text-base transition-transform active:scale-95"
                to="/"
                onClick={() => window.scrollTo(0, 0)}
              >
                <BrandPill
                  clickable
                  header
                  className="h-10 md:h-14 p-2 !py-0"
                />
              </Link>
            </div>

            {/* Show search box on /browse page - special case center */}
            {window.location.pathname.startsWith("/browse") && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 pointer-events-auto flex items-center gap-2">
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

            {/* Right Side: Icons (Search | Notification | Account) */}
            <div className="relative pointer-events-auto flex items-center gap-2 md:gap-4">
              {/* Search Icon */}
              {window.location.pathname === "/discover" && (
                <a
                  onClick={() => handleClick("/browse")}
                  rel="noreferrer"
                  className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center text-white tabbable rounded-full backdrop-blur-lg cursor-pointer bg-white/10 hover:bg-white/30 transition-all duration-200"
                >
                  <Search className="w-5 h-5 md:w-6 md:h-6" />
                </a>
              )}

              {/* Notification Icon (Visual only for now) */}
              <a
                className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center text-white tabbable rounded-full backdrop-blur-lg cursor-pointer bg-white/10 hover:bg-white/30 transition-all duration-200"
                onClick={() => {}} // Placeholder for notification logic
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
              </a>

              {/* Account/Settings Icon */}
              {!props.hideSettings &&
                (!window.location.pathname.startsWith("/browse") ||
                  window.innerWidth >= 768) && (
                  <div>
                    <LinksDropdown>
                      <a className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center text-white tabbable rounded-full backdrop-blur-lg cursor-pointer bg-white/10 hover:bg-white/30 transition-all duration-200">
                        <Settings className="w-5 h-5 md:w-6 md:h-6" />
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
