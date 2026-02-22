/* eslint-disable react/no-unused-prop-types */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import classNames from "classnames";
import { Bell, Search, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, To, useNavigate } from "react-router-dom";

import { BrandPill } from "./BrandPill";

import { LinksDropdown } from "@/components/LinksDropdown";
import { useBannerSize } from "@/stores/banner";
import { useDiscoverStore } from "@/stores/discover";

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
              ? scrollPosition > 100
                ? "bg-zinc-950/90 h-14 md:h-16 shadow-xl"
                : "bg-transparent h-15 md:h-12"
              : "bg-background-main/80 backdrop-blur-md h-14 md:h-16" // Mobile ambient header
            : "bg-transparent h-14 md:h-16",
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
        <div
          className={classNames(
            "flex items-center w-full max-w-[1920px] mx-auto px-4 md:px-12 h-14 md:h-16",
          )}
        >
          <div className="px-3 md:px-2.5 py-1.5 md:py-2.5 relative z-[60] flex flex-1 items-center justify-between">
            {/* Left Side: Logo & Category Links */}
            <div className="flex items-center gap-8 pointer-events-auto">
              <Link
                className="block tabbable rounded-full text-xs ssm:text-base transition-transform active:scale-95"
                to="/"
                onClick={() => window.scrollTo(0, 0)}
              >
                <BrandPill clickable header className="h-8 md:h-10 p-2 !py-0" />
              </Link>

              {/* Category Links - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    useDiscoverStore.getState().setSelectedCategory("movies");
                    navigate("/discover");
                    window.scrollTo(0, 0);
                  }}
                  className={classNames(
                    "px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200",
                    useDiscoverStore((state) => state.selectedCategory) ===
                      "movies" && window.location.pathname === "/discover"
                      ? "bg-white text-black shadow-lg scale-105"
                      : "text-gray-300 hover:text-white hover:bg-white/10",
                  )}
                >
                  Movies
                </button>
                <button
                  type="button"
                  onClick={() => {
                    useDiscoverStore.getState().setSelectedCategory("tvshows");
                    navigate("/discover");
                    window.scrollTo(0, 0);
                  }}
                  className={classNames(
                    "px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200",
                    useDiscoverStore((state) => state.selectedCategory) ===
                      "tvshows" && window.location.pathname === "/discover"
                      ? "bg-white text-black shadow-lg scale-105"
                      : "text-gray-300 hover:text-white hover:bg-white/10",
                  )}
                >
                  TV Shows
                </button>
              </div>
            </div>

            {/* Right Side: Icons (Search | Notification | Account) */}
            <div className="relative pointer-events-auto flex items-center gap-2 md:gap-4 ml-auto">
              {/* Search Icon */}
              {(window.location.pathname === "/discover" ||
                window.location.pathname.startsWith("/browse")) && (
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
